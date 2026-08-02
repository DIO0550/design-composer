import type { TauriIpc, Unsubscribe } from "@/libs/tauri-ipc";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * 失敗の種類。
 *
 * `notFound` 〜 `io` は Rust の `DocumentIoError`（`src-tauri/src/document/io/error.rs`）と
 * 対の語彙。`ipcFailed` だけは TS 側の追加で、Rust のコマンドに届く前後で起きた失敗を指す
 * （コマンド未登録・引数のデシリアライズ失敗・想定外の戻り値）。これらを `io` に丸めると
 * 「ファイル I/O が失敗した」という別の意味になるため分けている（#28）。
 */
export type DocumentIpcErrorKind =
  | "notFound"
  | "permissionDenied"
  | "invalidPath"
  | "invalidUtf8"
  | "io"
  | "ipcFailed";

export type DocumentIpcError = Readonly<{
  kind: DocumentIpcErrorKind;
  message: string;
}>;

/** 外部（AI・エディタ・git 操作等）による変更の通知。 */
export type DocumentChanged = Readonly<{
  path: string;
  content: string;
}>;

/**
 * `docs/05-architecture.md`「Tauri IPC」のコマンド名。Rust 側の関数名がそのまま
 * コマンド名になるため、`src-tauri/src/lib.rs` の `generate_handler!` と対で保つ。
 */
export type DocumentCommand =
  | "load_document"
  | "save_document"
  | "watch_document"
  | "unwatch_document";

/** 外部変更を知らせるイベント名（Rust 側の `DOCUMENT_CHANGED_EVENT` と対）。 */
const DOCUMENT_CHANGED_EVENT = "document-changed";

/**
 * ドキュメントの永続化 I/O。IPC を渡るのは常に生の JSON 文字列で、
 * パース・検証・マイグレーションは呼び出し側（`DocumentJson`）の担当。
 */
export type DocumentIpc = Readonly<{
  load(path: string): Promise<Result<string, DocumentIpcError>>;
  save(path: string, content: string): Promise<Result<void, DocumentIpcError>>;
  watch(path: string): Promise<Result<void, DocumentIpcError>>;
  unwatch(path: string): Promise<Result<void, DocumentIpcError>>;
  /**
   * 外部変更の購読を始め、解除関数を返す。
   *
   * 解除関数を `Promise` 越しに返すのは、`listen` の完了を待たないと購読が成立せず、
   * 同期の解除関数を返す形にすると `listen` 自体の失敗を握りつぶすことになるため。
   */
  subscribeChanged(
    listener: (changed: DocumentChanged) => void,
  ): Promise<Result<Unsubscribe, DocumentIpcError>>;
}>;

const IO_ERROR_KINDS: readonly DocumentIpcErrorKind[] = [
  "notFound",
  "permissionDenied",
  "invalidPath",
  "invalidUtf8",
  "io",
];

function isDocumentIoError(reason: unknown): reason is DocumentIpcError {
  if (typeof reason !== "object" || reason === null) {
    return false;
  }
  const { kind, message } = reason as Record<string, unknown>;
  return (
    typeof message === "string" &&
    IO_ERROR_KINDS.some((ioErrorKind) => ioErrorKind === kind)
  );
}

/**
 * reject された値を失敗として解釈する。
 *
 * Rust の `Err` はそのまま `DocumentIoError` の形で届くが、コマンドに届く前に
 * Tauri 自身が失敗した場合は文字列で reject される。形で見分けて後者を `ipcFailed` に寄せる。
 */
function toDocumentIpcError(reason: unknown): DocumentIpcError {
  if (isDocumentIoError(reason)) {
    return reason;
  }
  return { kind: "ipcFailed", message: String(reason) };
}

function toDocumentChanged(payload: unknown): Option<DocumentChanged> {
  if (typeof payload !== "object" || payload === null) {
    return Option.none;
  }
  const { path, content } = payload as Record<string, unknown>;
  if (typeof path !== "string" || typeof content !== "string") {
    return Option.none;
  }
  return Option.some({ path, content });
}

/**
 * コマンドを呼び、失敗を値として返す。
 *
 * ここが例外と `Result` の境界。`libs/` の外へ例外を出さないため、
 * このモジュールの公開 API はすべて `Result` を返す。
 */
async function call(
  tauriIpc: TauriIpc,
  command: DocumentCommand,
  args: Readonly<Record<string, unknown>>,
): Promise<Result<unknown, DocumentIpcError>> {
  try {
    return Result.ok(await tauriIpc.invoke(command, args));
  } catch (reason) {
    return Result.err(toDocumentIpcError(reason));
  }
}

/** 戻り値を持たないコマンドの結果。 */
function toCompletion(
  result: Result<unknown, DocumentIpcError>,
): Result<void, DocumentIpcError> {
  return Result.map(result, () => undefined);
}

/**
 * `load_document` の戻り値を読み込んだ内容として解釈する。
 *
 * IPC を渡ってくる値に型は無いので、`as` で通さず形を確かめてから返す。
 * 文字列以外が来るのは Rust 側と TS 側の版がずれたときで、`load` の結果としては扱えない。
 */
function toContent(value: unknown): Result<string, DocumentIpcError> {
  if (typeof value !== "string") {
    return Result.err({
      kind: "ipcFailed",
      message: `load_document が文字列以外を返した: ${String(value)}`,
    });
  }
  return Result.ok(value);
}

export const DocumentIpc = {
  create(tauriIpc: TauriIpc): DocumentIpc {
    return {
      async load(path) {
        return Result.flatMap(
          await call(tauriIpc, "load_document", { path }),
          toContent,
        );
      },

      async save(path, content) {
        return toCompletion(
          await call(tauriIpc, "save_document", { path, content }),
        );
      },

      async watch(path) {
        return toCompletion(await call(tauriIpc, "watch_document", { path }));
      },

      async unwatch(path) {
        return toCompletion(await call(tauriIpc, "unwatch_document", { path }));
      },

      async subscribeChanged(listener) {
        try {
          const unsubscribe = await tauriIpc.listen(
            DOCUMENT_CHANGED_EVENT,
            (payload) => {
              // 形が合わない値は配らない。ドキュメント変更として渡せる中身が無く、
              // イベントのコールバックには失敗を返す相手もいないため（#28）。
              const changed = toDocumentChanged(payload);
              if (changed.some) {
                listener(changed.value);
              }
            },
          );
          return Result.ok(unsubscribe);
        } catch (reason) {
          return Result.err(toDocumentIpcError(reason));
        }
      },
    };
  },
} as const;

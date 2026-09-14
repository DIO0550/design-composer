import { TauriIpc } from "@/libs/tauri-ipc";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/** アプリ自身の状態を読み書きできなかったことと、診断用の原文。 */
export type AppStateIpcError = Readonly<{ message: string }>;

/** `docs/05-architecture.md`「Tauri IPC」が挙げているアプリ自身の状態のコマンド名。 */
export type AppStateCommand = "load_app_state" | "save_app_state";

/**
 * アプリ自身の状態の永続化 I/O。IPC を渡るのは常に生の JSON 文字列で、
 * 解釈は呼び出し側（`AppStateJson`）の担当。
 */
export type AppStateIpc = Readonly<{
  /** 保存されている中身を読む。まだ一度も保存していなければ `none`。 */
  load(): Promise<Result<Option<string>, AppStateIpcError>>;
  /** 中身を置き換える。 */
  save(content: string): Promise<Result<void, AppStateIpcError>>;
}>;

/**
 * Rust 側が返した拒否理由が、原文を持つ失敗として読めるか。
 *
 * @param reason reject された値
 * @returns 文言を持つ失敗として読めれば true
 */
function isAppStateIoError(reason: unknown): reason is AppStateIpcError {
  if (typeof reason !== "object" || reason === null) {
    return false;
  }
  const { message } = reason as Record<string, unknown>;
  return typeof message === "string";
}

/**
 * reject された値を失敗として解釈する。
 *
 * Rust の `Err` は文言を持つ形で届くが、コマンドに届く前に Tauri 自身が失敗した場合は
 * 文字列で reject される。形で見分けて後者も同じ失敗へ寄せる。
 *
 * @param reason reject された値
 * @returns 診断用の原文を持つ失敗
 */
function toAppStateIpcError(reason: unknown): AppStateIpcError {
  if (isAppStateIoError(reason)) {
    return reason;
  }
  return { message: String(reason) };
}

/**
 * `load_app_state` の戻り値を、保存されている中身として解釈する。
 *
 * IPC を渡ってくる値に型は無いので、`as` で通さず形を確かめてから返す。
 *
 * @param value `load_app_state` が返した値
 * @returns 保存されている中身。まだ保存していなければ `none`。文字列でも `null` でも
 *   なければ、その旨を持つ失敗
 */
function toStoredContent(
  value: unknown,
): Result<Option<string>, AppStateIpcError> {
  if (value === null) {
    return Result.ok(Option.none);
  }
  if (typeof value !== "string") {
    return Result.err({
      message: `load_app_state が文字列でも null でもない値を返した: ${String(value)}`,
    });
  }
  return Result.ok(Option.some(value));
}

export const AppStateIpc = {
  create(tauriIpc: TauriIpc): AppStateIpc {
    const call = TauriIpc.caller<AppStateCommand, AppStateIpcError>(
      tauriIpc,
      toAppStateIpcError,
    );

    return {
      async load() {
        return Result.flatMap(
          await call("load_app_state", {}),
          toStoredContent,
        );
      },

      async save(content) {
        return Result.map(
          await call("save_app_state", { content }),
          () => undefined,
        );
      },
    };
  },
} as const;

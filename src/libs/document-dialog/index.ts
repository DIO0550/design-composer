import { FilePath } from "@/domains/unit/file-path";
import { TauriIpc } from "@/libs/tauri-ipc";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * ダイアログを出せなかった・選ばれたものを Rust が受け付けなかった（`.dcmp` 以外を選んだ
 * など）・選ばれたパスがファイル名の要素を持たなかった失敗。
 *
 * 分岐すべき失敗が増えたらそのときに直和へ広げる。
 */
export type DocumentDialogError = Readonly<{ message: string }>;

/**
 * ダイアログを出すコマンド名（`src-tauri/src/document/dialog.rs`）。絞り込みと保存の既定の
 * 名前は Rust 側が持つ。
 */
type DocumentDialogCommand =
  | "choose_open_document_path"
  | "choose_save_document_path";

/**
 * .dcmp を選ばせるダイアログ。
 *
 * 選ばずに閉じたことは失敗ではないので `Option`（`none`）で、ダイアログ自体を
 * 出せなかったこと・選ばれたものを受け付けられなかったことは `Result`（`Err`）で
 * 表す。2 つを 1 つに潰すと、呼び出し側が「利用者がやめた」と「アプリが壊れている」を
 * 区別できなくなる。
 */
export type DocumentDialog = Readonly<{
  chooseOpenPath(): Promise<Result<Option<FilePath>, DocumentDialogError>>;
  chooseSavePath(): Promise<Result<Option<FilePath>, DocumentDialogError>>;
}>;

/**
 * reject された値を失敗として読む。
 *
 * Rust の `Err` は `{ kind, message }` の形で、コマンドに届く前に Tauri 自身が失敗した場合は
 * 文字列で届く。どちらも利用者に見せる原文は 1 つなので、形で見分けて `message` に寄せる。
 *
 * @param reason reject された値
 * @returns Rust 由来ならその `message`、それ以外は値を文字列にしたものを持つ失敗
 */
function toDocumentDialogError(reason: unknown): DocumentDialogError {
  if (typeof reason === "object" && reason !== null) {
    const { message } = reason as Record<string, unknown>;
    if (typeof message === "string") {
      return { message };
    }
  }
  return { message: String(reason) };
}

/**
 * コマンドが返した値を、選ばれたファイルのパスとして受け入れる。
 *
 * @param command 値を返したコマンド
 * @param value コマンドが返した値（閉じたなら `null`）
 * @returns ファイルのパス（閉じたなら `none`）。文字列でも `null` でもないときは、その旨と
 *   受け取った値を持つ失敗。ファイル名の要素を持たなければ、その旨と受け取った原文を持つ失敗
 */
function toChosenPath(
  command: DocumentDialogCommand,
  value: unknown,
): Result<Option<FilePath>, DocumentDialogError> {
  if (value === null) {
    return Result.ok(Option.none);
  }
  if (typeof value !== "string") {
    return Result.err({
      message: `${command} が文字列以外を返した: ${String(value)}`,
    });
  }
  const path = FilePath.create(value);
  return Option.isSome(path)
    ? Result.ok(path)
    : Result.err({
        message: `選ばれたパスがファイル名を持たない: ${value}`,
      });
}

/**
 * .dcmp を選ばせるダイアログを作る。
 *
 * ダイアログは Rust が出し、選ばれたパスを開いてよいものとして記録してから、寄せた綴りを
 * 返す（docs/05-architecture.md「選ばれたファイルの記録」）。
 *
 * @param tauriIpc ダイアログのコマンドを呼ぶ IPC
 * @returns `tauriIpc` を通して .dcmp を選ばせるダイアログ。失敗はすべて値として返す
 */
export function createDocumentDialog(tauriIpc: TauriIpc): DocumentDialog {
  const call = TauriIpc.caller<DocumentDialogCommand, DocumentDialogError>(
    tauriIpc,
    toDocumentDialogError,
  );
  const choose = async (
    command: DocumentDialogCommand,
  ): Promise<Result<Option<FilePath>, DocumentDialogError>> =>
    Result.flatMap(await call(command, {}), (value) =>
      toChosenPath(command, value),
    );

  return {
    chooseOpenPath() {
      return choose("choose_open_document_path");
    },

    chooseSavePath() {
      return choose("choose_save_document_path");
    },
  };
}

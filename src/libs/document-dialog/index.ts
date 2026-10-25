import { FilePath } from "@/domains/unit/file-path";
import type { FileFilter, TauriDialog } from "@/libs/tauri-dialog";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * ダイアログを出せなかった・選ばれたパスがファイル名の要素を持たなかった失敗。
 *
 * 分岐すべき失敗が増えたらそのときに直和へ広げる。
 */
export type DocumentDialogError = Readonly<{ message: string }>;

/** 1 ドキュメント = 1 ファイル（docs/01-file-format.md「ファイル」）。 */
const DocumentFileFilter: FileFilter = {
  name: "Design Composer ドキュメント",
  extensions: ["dcmp"],
};

/** 新規作成の保存ダイアログに入れておく名前。 */
const DefaultFileName = "untitled.dcmp";

/**
 * .dcmp を選ばせるダイアログ。
 *
 * 選ばずに閉じたことは失敗ではないので `Option`（`none`）で、ダイアログ自体を
 * 出せなかったこと・選ばれたパスがファイル名の要素を持たなかったことは `Result`（`Err`）で
 * 表す。2 つを 1 つに潰すと、呼び出し側が「利用者がやめた」と「アプリが壊れている」を
 * 区別できなくなる。
 */
export type DocumentDialog = Readonly<{
  chooseOpenPath(): Promise<Result<Option<FilePath>, DocumentDialogError>>;
  chooseSavePath(): Promise<Result<Option<FilePath>, DocumentDialogError>>;
}>;

/**
 * 選ばれたパスを、ファイルのパスとして受け入れる。
 *
 * @param chosen ダイアログが返したパス（閉じたなら `none`）
 * @returns ファイルのパス（閉じたなら `none`）。ファイル名の要素を持たなければ、その旨と
 *   受け取った原文を持つ失敗
 */
function toChosenPath(
  chosen: Option<string>,
): Result<Option<FilePath>, DocumentDialogError> {
  if (!Option.isSome(chosen)) {
    return Result.ok(Option.none);
  }
  const path = FilePath.create(chosen.value);
  return Option.isSome(path)
    ? Result.ok(path)
    : Result.err({
        message: `選ばれたパスがファイル名を持たない: ${chosen.value}`,
      });
}

/**
 * ダイアログを出し、失敗を値として返す。
 *
 * ここが例外と `Result` の境界。`libs/` の外へ例外を出さないため、
 * このモジュールの公開 API はすべて `Result` を返す。
 *
 * @param chooser 実際にダイアログを出す手続き
 * @returns 選ばれたパス（閉じたなら `none`）。手続きが投げたら、投げた値を文字列にした
 *   `message` を持つ失敗（`Error` なら前に `Error: ` が付く）。選ばれたパスがファイル名の
 *   要素を持たなければ、その旨と受け取った原文を持つ失敗
 */
async function choose(
  chooser: () => Promise<Option<string>>,
): Promise<Result<Option<FilePath>, DocumentDialogError>> {
  try {
    return toChosenPath(await chooser());
  } catch (reason) {
    return Result.err({ message: String(reason) });
  }
}

/**
 * .dcmp を選ばせるダイアログを作る。
 *
 * @param dialog 実際にダイアログを出す口。絞り込みと保存の既定の名前はこのモジュールが渡す
 * @returns `dialog` を通して .dcmp を選ばせるダイアログ
 */
export function createDocumentDialog(dialog: TauriDialog): DocumentDialog {
  return {
    chooseOpenPath() {
      return choose(() => dialog.chooseOpenPath(DocumentFileFilter));
    },

    chooseSavePath() {
      return choose(() =>
        dialog.chooseSavePath(DocumentFileFilter, DefaultFileName),
      );
    },
  };
}

import type { FileFilter, TauriDialog } from "@/libs/tauri-dialog";
import type { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * ダイアログを出せなかった失敗。
 *
 * `DocumentIpcError` と違って `kind` を持たないのは、この境界で起きうる失敗が
 * 「ダイアログを出せなかった」の 1 種類しかなく、呼び出し側が分岐する語彙にならないため。
 * 分岐すべき失敗が増えたらそのときに直和へ広げる。
 */
export type DocumentDialogError = Readonly<{ message: string }>;

/** 1 ドキュメント = 1 ファイル（docs/01-file-format.md「ファイル」）。 */
const DOCUMENT_FILE_FILTER: FileFilter = {
  name: "Design Composer ドキュメント",
  extensions: ["dcmp"],
};

/** 新規作成の保存ダイアログに入れておく名前。 */
const DEFAULT_FILE_NAME = "untitled.dcmp";

/**
 * .dcmp を選ばせるダイアログ。
 *
 * 選ばずに閉じたことは失敗ではないので `Option`（`none`）で、ダイアログ自体を
 * 出せなかったことは `Result`（`Err`）で表す。2 つを 1 つに潰すと、呼び出し側が
 * 「利用者がやめた」と「アプリが壊れている」を区別できなくなる。
 */
export type DocumentDialog = Readonly<{
  chooseOpenPath(): Promise<Result<Option<string>, DocumentDialogError>>;
  chooseSavePath(): Promise<Result<Option<string>, DocumentDialogError>>;
}>;

/**
 * ダイアログを出し、失敗を値として返す。
 *
 * ここが例外と `Result` の境界。`libs/` の外へ例外を出さないため、
 * このモジュールの公開 API はすべて `Result` を返す。
 *
 * @param chooser 実際にダイアログを出す手続き
 * @returns 選ばれたパス（閉じたなら `none`）。手続きが投げたら失敗として返す
 */
async function choose(
  chooser: () => Promise<Option<string>>,
): Promise<Result<Option<string>, DocumentDialogError>> {
  try {
    return Result.ok(await chooser());
  } catch (reason) {
    return Result.err({ message: String(reason) });
  }
}

export const DocumentDialog = {
  create(dialog: TauriDialog): DocumentDialog {
    return {
      chooseOpenPath() {
        return choose(() => dialog.chooseOpenPath(DOCUMENT_FILE_FILTER));
      },

      chooseSavePath() {
        return choose(() =>
          dialog.chooseSavePath(DOCUMENT_FILE_FILTER, DEFAULT_FILE_NAME),
        );
      },
    };
  },
} as const;

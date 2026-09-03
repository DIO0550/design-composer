import { ArrayEx } from "@/utils/ArrayEx";
import type { Option } from "@/utils/Option";

/**
 * パスの区切り。動かす OS の綴りで届く（Windows は `\`）ため両方を区切りとして扱う。
 */
const Separator = /[\\/]/;

/**
 * パスを区切りで割った並び。
 *
 * @param path 割る対象のパス
 * @returns 空の要素を落とした並び（区切りの連続・先頭の区切りで空が生まれる）
 */
function segments(path: string): readonly string[] {
  return path.split(Separator).filter((segment) => segment.length > 0);
}

/**
 * ファイルの居場所を表す文字列に対する操作。
 *
 * 答えるのは構造（どの要素か）だけで、区切りをどう見せるかは表示側の関心事。
 * 開いているドキュメント（`OpenedDocument`）と最近使ったファイルの一覧はどちらも
 * 名前を要るが、後者はパスしか持たないため、パスだけで済む規則をここへ置く。
 */
export const FilePath = {
  /**
   * 末尾のファイルの名前。
   *
   * @param path 名前を知りたいパス
   * @returns パスの末尾の要素。パスに要素が 1 つも無ければ `none`
   */
  fileName(path: string): Option<string> {
    return ArrayEx.last(segments(path));
  },

  /**
   * ファイルを収めているフォルダの名前。
   *
   * @param path 収め先を知りたいパス
   * @returns パスの末尾から 2 番目の要素。相対パスのファイル名だけ（`app.dcmp`）や
   *   ルート直下（`/app.dcmp`）にはフォルダの名前が無いので `none`。
   *   Windows のドライブ直下（`C:\app.dcmp`）はドライブ名（`C:`）を返す
   *   （区切りで割った 2 番目という規則をドライブ名だけ例外にすると、
   *   仕様に無い正規化をここへ持ち込むことになるため）
   */
  folderName(path: string): Option<string> {
    return ArrayEx.last(ArrayEx.dropLast(segments(path)));
  },
} as const;

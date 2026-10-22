import type { Brand } from "@/types/Brand";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

declare const FilePathBrand: unique symbol;

/**
 * ファイル名の要素を 1 つ以上持つことを確かめた、ファイルの居場所。綴りは受け取ったまま
 * で、正規化はしない。
 *
 * `create` を通った値だけがファイル名の要素を持つので、その不変条件をブランドで型に固定する。
 * `{ raw: string }` の record にはしない。IPC の引数・`key`・`title`・保存する状態の綴りと
 * 文字列のまま使う箇所が多く、境界ごとに取り出しが要るため。
 */
export type FilePath = Brand<string, typeof FilePathBrand>;

/**
 * パスの区切り。動かす OS の綴りで届く（Windows は `\`）ため両方を区切りとして扱う。
 */
const Separator = /[\\/]/;

/**
 * パスを区切りで割った並び。`create` / `fileName` / `folderName` はすべてこの割り方から答える。
 *
 * @param path 割る対象のパス
 * @returns 空の要素を落とした並び（区切りの連続・先頭の区切りで空が生まれる）
 */
function segments(path: string): readonly string[] {
  return path.split(Separator).filter((segment) => segment.length > 0);
}

/**
 * パスの末尾の要素。
 *
 * 要素が無ければ空文字になる。`create` はこれが空でないことを条件にするので、`FilePath` を
 * 受ける `fileName` からは空は返らない。
 *
 * @param path 末尾を知りたいパス
 * @returns 末尾の要素。要素が 1 つも無ければ空文字列
 */
function lastSegment(path: string): string {
  return segments(path).slice(-1).join("");
}

export const FilePath = {
  /**
   * 外から届いた文字列を、ファイルのパスとして受け入れる。
   *
   * @param raw ダイアログ・ドロップ・保存されている状態・変更通知から届いたパス
   * @returns 綴りを変えずにファイルのパスとしたもの。区切りしか無い・空のときは `none`
   */
  create(raw: string): Option<FilePath> {
    return lastSegment(raw).length > 0
      ? Option.some(raw as FilePath)
      : Option.none;
  },

  /**
   * 末尾のファイルの名前。
   *
   * @param path 名前を知りたいパス
   * @returns パスの末尾の要素
   */
  fileName(path: FilePath): string {
    // 末尾を `Option` で取って `Option.unwrap` で開けることはしない。本番のコードに例外の経路を置かないため。
    return lastSegment(path);
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
  folderName(path: FilePath): Option<string> {
    return ArrayEx.last(ArrayEx.dropLast(segments(path)));
  },
} as const;

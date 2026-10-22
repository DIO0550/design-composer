import { FilePath } from "@/domains/unit/file-path";
import { Option } from "@/utils/Option";

/**
 * テストとストーリーが書くパスを、ファイルのパスにする。
 *
 * @param raw ファイル名の要素を持つパス
 * @returns 綴りを変えずにファイルのパスとしたもの
 * @throws `raw` がファイル名の要素を持たないとき（書いたパスの誤りでテストを落とす）
 */
export function filePath(raw: string): FilePath {
  return Option.unwrap(FilePath.create(raw));
}

import { Result } from "@/utils/Result";

/** JSON のテキストの読み込み。 */
export const JsonText = {
  /**
   * テキストを JSON の値として読む。`JSON.parse` が投げる例外をここで値にする。
   * 失敗の意味づけ（どのファイルのどこか）は呼び出し側が与える。
   *
   * @param text 読み込むテキスト
   * @returns 読み込んだ値。JSON として読めなければその文言の `err`
   */
  parse(text: string): Result<unknown, string> {
    try {
      const value: unknown = JSON.parse(text);
      return Result.ok(value);
    } catch (error) {
      return Result.err(error instanceof Error ? error.message : String(error));
    }
  },
} as const;

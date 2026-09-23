/** 文字列・文字に対する汎用操作。 */
export const StringEx = {
  /**
   * 空白として扱う文字か。
   *
   * @param ch 走査中の 1 文字
   * @returns 半角空白・タブ・LF・CR なら true。全角空白などそれ以外の空白は false
   */
  isWhitespace(ch: string): boolean {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
  },

  /**
   * 半角の数字か。
   *
   * @param ch 走査中の 1 文字。2 文字以上を渡すと文字列の大小で比べるので、`"10"` も true になる
   * @returns 半角の `0`〜`9` なら true。全角の数字は false
   */
  isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  },

  /**
   * 大文字小文字を無視した部分一致。
   *
   * @param text 探される側の文字列
   * @param part 探す部分
   * @returns `text` が `part` を含めば true。空の `part` はすべてに一致する
   */
  includesIgnoreCase(text: string, part: string): boolean {
    return text.toLowerCase().includes(part.toLowerCase());
  },
} as const;

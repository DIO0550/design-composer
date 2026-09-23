/** 半角の数字 1 文字だけからなる綴り。 */
const DigitPattern = /^[0-9]$/;

/** 文字列・文字に対する汎用操作。 */
export const StringEx = {
  /**
   * 空白として扱う 1 文字か。
   *
   * @param text 判定する文字列
   * @returns 半角空白・タブ・LF・CR の 1 文字だけなら true。2 文字以上・空文字と、
   *   全角空白などそれ以外の空白は false
   */
  isWhitespace(text: string): boolean {
    return text === " " || text === "\t" || text === "\n" || text === "\r";
  },

  /**
   * 半角の数字 1 文字か。
   *
   * @param text 判定する文字列
   * @returns 半角の `0`〜`9` の 1 文字だけなら true。2 文字以上(`"10"`)・空文字と、
   *   全角の数字は false
   */
  isDigit(text: string): boolean {
    return DigitPattern.test(text);
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

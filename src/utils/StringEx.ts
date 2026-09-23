/** 文字列・文字に対する汎用操作。 */
export const StringEx = {
  /**
   * 空白の文字か。
   *
   * @param ch 見たい文字
   * @returns 半角空白・タブ・LF・CR のどれかなら true。全角空白などほかの Unicode の空白は false
   */
  isWhitespace(ch: string): boolean {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
  },

  /**
   * ASCII の数字か。
   *
   * @param ch 見たい文字
   * @returns `"0"` 以上 `"9"` 以下なら true。全角数字は false。文字列の辞書順で比べるので、
   *   2 文字以上を渡すと `"12"` は true、`"9a"` は false になる
   */
  isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  },

  /**
   * 大文字小文字を無視した部分一致。
   *
   * @param text 探す先の文字列
   * @param part 含まれていてほしい文字列
   * @returns 小文字にそろえた `text` が小文字にそろえた `part` を含むなら true。空の `part` は
   *   すべてに一致する
   */
  includesIgnoreCase(text: string, part: string): boolean {
    return text.toLowerCase().includes(part.toLowerCase());
  },
} as const;

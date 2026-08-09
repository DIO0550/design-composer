/** 文字列・文字に対する汎用操作。 */
export const StringEx = {
  isWhitespace(ch: string): boolean {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
  },

  isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  },

  /** 大文字小文字を無視した部分一致。空の `part` はすべてに一致する。 */
  includesIgnoreCase(text: string, part: string): boolean {
    return text.toLowerCase().includes(part.toLowerCase());
  },
} as const;

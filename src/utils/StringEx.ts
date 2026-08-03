export const StringEx = {
  isWhitespace(ch: string): boolean {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
  },

  isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  },
} as const;

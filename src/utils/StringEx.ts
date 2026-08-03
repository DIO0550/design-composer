export const StringEx = {
  isWhitespace(ch: string): boolean {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
  },

  isDigit(ch: string): boolean {
    return ch >= "0" && ch <= "9";
  },

  /**
   * 識別子を表示用のラベルにする。camelCase の切れ目で語に分け、先頭を大文字にする
   * (`paddingX` → `Padding X`)。
   */
  toLabel(identifier: string): string {
    const words = identifier.replace(/([A-Z])/g, " $1");
    return words.charAt(0).toUpperCase() + words.slice(1);
  },
} as const;

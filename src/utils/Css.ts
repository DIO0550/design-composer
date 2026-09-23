/** CSS のテキストとして安全に埋め込む形へ変換する。 */
export const Css = {
  /**
   * 二重引用符で囲む文字列（属性選択子の値など）として安全な形にする。
   * `\` を先に処理しないと、後から足した `\` 自身が escape 対象になってしまう。
   *
   * @param value 埋め込みたい生の文字列
   * @returns `\` と `"` の前に `\` を足した文字列。改行は変換しないので、改行を含む値は
   *   CSS の文字列として不正になる
   */
  escapeQuotedString(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  },
} as const;

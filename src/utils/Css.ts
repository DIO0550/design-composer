export const Css = {
  /**
   * 二重引用符で囲む文字列（属性選択子の値など）として安全な形にする。
   * `\` を先に処理しないと、後から足した `\` 自身が escape 対象になってしまう。
   */
  escapeQuotedString(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  },
} as const;

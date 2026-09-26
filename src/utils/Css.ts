/** CSS のテキストとして安全に埋め込む形へ変換する。 */
export const Css = {
  /**
   * 二重引用符で囲む文字列（属性選択子の値など）の中で、`\` と `"` が区切りとして
   * 読まれない形にする。改行は escape しないので、改行を含む値には使えない。
   * `\` を先に処理しないと、後から足した `\` 自身が escape 対象になってしまう。
   *
   * @param value 引用符の内側へ入れる生の文字列
   * @returns `\` と `"` の前に `\` を置いた文字列。囲む `"` は付けない
   */
  escapeQuotedString(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  },

  /**
   * 属性の値が一致する要素を指す属性選択子。
   *
   * @param attribute 見る属性の名前。escape せずそのまま埋め込む
   * @param value 一致させる値。引用符の内側へ入れるので `escapeQuotedString` を通す
   * @returns `[attribute="value"]` の形の選択子
   */
  attributeSelector(attribute: string, value: string): string {
    return `[${attribute}="${Css.escapeQuotedString(value)}"]`;
  },
} as const;

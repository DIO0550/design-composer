/**
 * HTML テキストとして安全に埋め込める形にする。
 * `&` `<` `>` を実体参照へ変換し、引用符は変換しない
 * (テキストの位置では引用符は意味を持たず、内容が読みにくくなるため)。
 *
 * @param value 埋め込みたい生のテキスト
 * @returns `&` `<` `>` を実体参照へ置き換えたテキスト
 */
function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** HTML のテキスト・属性値として安全に埋め込む形へ変換する。 */
export const Html = {
  escapeText,

  /** 二重引用符で囲む属性値として安全な形にする。 */
  escapeAttribute(value: string): string {
    return escapeText(value).replace(/"/g, "&quot;");
  },
} as const;

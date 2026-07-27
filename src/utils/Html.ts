/**
 * HTML テキストとして安全に埋め込める形にする。
 * タグの開始とエンティティの開始だけを潰し、引用符は変換しない
 * (テキストの位置では意味を持たず、内容が読みにくくなるため)。
 */
function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const Html = {
  escapeText,

  /** 二重引用符で囲む属性値として安全な形にする。 */
  escapeAttribute(value: string): string {
    return escapeText(value).replace(/"/g, "&quot;");
  },
} as const;

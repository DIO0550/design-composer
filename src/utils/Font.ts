/**
 * OS 標準フォントへ順にフォールバックするフォントスタック。
 * フォントファミリが指定されていないときの既定値として使う。
 */
const SystemStack =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** フォントファミリの指定に使う文字列。 */
export const Font = {
  /**
   * OS 標準フォントへ順にフォールバックするフォントスタック。
   *
   * @returns CSS の `font-family` にそのまま書ける、フォント名をカンマで区切った並び
   */
  systemStack(): string {
    return SystemStack;
  },
} as const;

/**
 * OS 標準フォントへ順にフォールバックするフォントスタック。
 * フォントファミリが指定されていないときの既定値として使う。
 */
const SystemStack =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** フォントファミリの指定に使う文字列。 */
export const Font = {
  systemStack(): string {
    return SystemStack;
  },
} as const;

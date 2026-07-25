/**
 * OS 標準フォントへ順にフォールバックするフォントスタック。
 * フォントファミリが指定されていないときの既定値として使う。
 */
const SYSTEM_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const Font = {
  systemStack(): string {
    return SYSTEM_STACK;
  },
} as const;

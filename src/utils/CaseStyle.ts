/*
 * 識別子の綴りの流儀(case style)を変換する。
 *
 * 流儀の呼び名は JS で事実上の標準になっている change-case の語彙に合わせる
 * (camelCase / PascalCase / snake_case / kebab-case / CONSTANT_CASE / Capital Case)。
 * 語を空白で区切って各語の先頭を大文字にしたものは Capital Case であり、
 * 語を繋げる PascalCase(`PaddingX`)とは別の流儀なので名前を取り違えない。
 */
export const CaseStyle = {
  /**
   * camelCase を Capital Case にする(`paddingX` → `Padding X`)。
   * camelCase では大文字が語の始まりなので、そこへ空白を入れて先頭を大文字にする
   * (2語目以降は元から大文字なので改めて変換しない)。
   */
  toCapitalCase(camelCase: string): string {
    const words = camelCase.replace(/([A-Z])/g, " $1");
    return words.charAt(0).toUpperCase() + words.slice(1);
  },
} as const;

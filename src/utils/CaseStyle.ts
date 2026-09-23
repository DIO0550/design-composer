/*
 * 識別子の綴りの流儀(case style)を変換する。
 *
 * 流儀の呼び名は JS で事実上の標準になっている change-case の語彙に合わせる
 * (camelCase / PascalCase / snake_case / kebab-case / CONSTANT_CASE / Capital Case)。
 * 語を空白で区切って各語の先頭を大文字にしたものは Capital Case であり、
 * 語を繋げる PascalCase(`PositionX`)とは別の流儀なので名前を取り違えない。
 */
/**
 * kebab-case の綴り。使用可能文字は `[a-z0-9-]` で、
 * 先頭・末尾のハイフンと連続ハイフンは許さない。
 */
const KebabCasePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** 先頭を除いた位置にある大文字。camelCase / PascalCase ではそこが語の始まり。 */
const InnerUpperCasePattern = /(?!^)([A-Z])/g;

/** 綴りの流儀どうしの変換と判定。 */
export const CaseStyle = {
  /**
   * kebab-case として綴られているか。
   *
   * ドキュメント内の名前（部品名・artboard 名・ノード名・トークン名）はすべて
   * この流儀に従うが、「どの名前がこの規則に縛られるか」は綴りの流儀ではなく
   * 名前の側の知識なので、判定だけをここに置いて意味づけは呼び出し側で与える。
   *
   * @param value 判定する綴り
   * @returns `KebabCasePattern` の規則どおりの綴りなら true
   */
  isKebabCase(value: string): boolean {
    return KebabCasePattern.test(value);
  },

  /**
   * camelCase / PascalCase を Capital Case にする(`positionX` / `PositionX` → `Position X`)。
   * 先頭以外の大文字の前へ空白を入れ、先頭を大文字にする。
   *
   * @param value 変換する綴り
   * @returns 先頭以外の大文字ごとに空白で区切り、先頭を大文字にした綴り。連続する大文字は
   *   1 字ずつ区切られ(`fooURL` → `Foo U R L`)、`-` `_` は区切りとして扱わない
   *   (`width-mode` → `Width-mode`)
   */
  toCapitalCase(value: string): string {
    const words = value.replace(InnerUpperCasePattern, " $1");
    return words.charAt(0).toUpperCase() + words.slice(1);
  },
} as const;

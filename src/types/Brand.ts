/**
 * 素の型と構造が同じでも、取り違えを型で弾けるようにするための目印付きの型。テンプレー
 * トリテラル型で構造を狭められない値に使う。
 *
 * 目印を型引数で受け取るのは、`unique symbol` が宣言した場所ごとに別の型になる性質を使
 * うため。目印までこの型に書くと、ここから作った型がすべて同じ目印を共有してしまう。
 *
 * 値を作れるのは、その事実を実行時に成立させる `create` の中だけ（rules/coding.md「狭い
 * 型への `as` は…戻り値1箇所のみ」）。
 *
 * @example
 * declare const FontWeightBrand: unique symbol;
 * export type FontWeight = Brand<number, typeof FontWeightBrand>;
 *
 * export const FontWeight = {
 *   create(value: number): Option<FontWeight> {
 *     return NumberEx.isWithin(value, { min: 100, max: 900 })
 *       ? Option.some(value as FontWeight)
 *       : Option.none;
 *   },
 * } as const;
 */
export type Brand<T, Tag extends symbol> = T & { readonly __brand: Tag };

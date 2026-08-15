/**
 * 素の型と構造が同じでも、取り違えを型で弾けるようにするための目印付きの型。
 *
 * 数値のように `Px` / `Rgb` のようなテンプレートリテラル型で構造を狭められない
 * 値に対して使う(rules/coding.md「ブランド型は構造で表現できない場合の最終手段」)。
 *
 * 目印を型引数で受け取るのは、`unique symbol` が**宣言した場所ごとに別の型**に
 * なる性質を使うため。目印までこの型の中に書くと、ここから作った型がすべて
 * 同じ目印を共有してしまい、取り違えを弾けなくなる。
 *
 * 値を作れるのは、その事実を実行時に成立させる `create` の中だけ
 * (rules/coding.md「狭い型への `as` は…戻り値1箇所のみ」)。
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

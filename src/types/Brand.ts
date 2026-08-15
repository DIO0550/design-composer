/**
 * 素の型と構造が同じでも、取り違えを型で弾けるようにするための目印付きの型。
 *
 * 数値のように `Px` / `Rgb` のようなテンプレートリテラル型で構造を狭められない
 * 値に対して使う(rules/coding.md「ブランド型は構造で表現できない場合の最終手段」)。
 * `Name` が違えば互いに代入できないので、同じ `number` を元にした型どうしの
 * 取り違えもコンパイルエラーになる。
 *
 * 値を作れるのは、その事実を実行時に成立させる `create` の中だけ
 * (`rules/coding.md`「狭い型への `as` は…戻り値1箇所のみ」)。
 *
 * @example
 * export type FontWeight = Brand<number, "FontWeight">;
 * export const FontWeight = {
 *   create(value: number): Option<FontWeight> {
 *     return NumberEx.isWithin(value, { min: 100, max: 900 })
 *       ? Option.some(value as FontWeight)
 *       : Option.none;
 *   },
 * } as const;
 */
export type Brand<T, Name extends string> = T & { readonly __brand: Name };

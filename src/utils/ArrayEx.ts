import { NumberEx } from "@/utils/NumberEx";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * 配列の位置指定が範囲外だったことを表す。
 * ドメイン知識を持たないので、意味づけ（どの操作のどの引数か）は呼び出し側で与える。
 */
export type IndexOutOfRange = Readonly<{
  index: number;
  length: number;
}>;

/**
 * 範囲外の指定を、範囲と指定値を添えた失敗にする。
 *
 * @param array 範囲の出どころになる配列
 * @param index 範囲外だった指定値
 * @returns 指定値と配列の長さを持つ `Result.err`
 */
function outOfRange<T>(
  array: readonly T[],
  index: number,
): Result<never, IndexOutOfRange> {
  return Result.err({ index, length: array.length });
}

/** 配列に対する汎用操作。 */
export const ArrayEx = {
  /**
   * 既にある要素を指す位置か。
   *
   * @param array 位置の範囲を決める並び
   * @param index 要素を指したい位置
   * @returns 0 以上の整数で、長さ未満なら true。負・小数・長さちょうど以上は false
   */
  isIndexInRange<T>(array: readonly T[], index: number): boolean {
    return NumberEx.isNatural(index) && index < array.length;
  },

  /**
   * 要素を差し込める位置か。`isIndexInRange` と違い、末尾の後ろ（長さちょうど）も含む。
   *
   * @param array 位置の範囲を決める並び
   * @param index 差し込みたい位置
   * @returns 0 以上の整数で、長さ以下なら true。負・小数・長さを超える位置は false
   */
  isInsertionIndexInRange<T>(array: readonly T[], index: number): boolean {
    return NumberEx.isNatural(index) && index <= array.length;
  },

  /**
   * 先頭の要素。
   *
   * @param array 先頭を見たい並び
   * @returns 先頭の要素。空の並びと、先頭が `null` / `undefined` の並びでは `none`
   */
  first<T>(array: readonly T[]): Option<NonNullable<T>> {
    return Option.fromNullable(array[0]);
  },

  /**
   * 末尾の要素。
   *
   * @param array 末尾を見たい並び
   * @returns 末尾の要素。空の並びと、末尾が `null` / `undefined` の並びでは `none`
   */
  last<T>(array: readonly T[]): Option<NonNullable<T>> {
    return Option.fromNullable(array[array.length - 1]);
  },

  /**
   * 先頭を除いた並び。
   *
   * @param array 先頭を除きたい並び
   * @returns 先頭を除いた新しい並び。空の並びからは空の並び
   */
  dropFirst<T>(array: readonly T[]): readonly T[] {
    return array.slice(1);
  },

  /**
   * 末尾を除いた並び。
   *
   * @param array 末尾を除きたい並び
   * @returns 末尾を除いた新しい並び。空の並びからは空の並び
   */
  dropLast<T>(array: readonly T[]): readonly T[] {
    return array.slice(0, -1);
  },

  /**
   * 含まれていなければ先頭へ足した並び。
   *
   * @param array 足す前の並び
   * @param item 先頭へ足したい値
   * @returns 含まれていなければ先頭へ足した新しい並び。既に含まれていれば元の並びのまま
   *   （`distinct` と違い、既にある値の位置を動かさない）
   */
  prependIfAbsent<T>(array: readonly T[], item: T): readonly T[] {
    return array.includes(item) ? array : [item, ...array];
  },

  /**
   * 重複を取り除いた並び。
   *
   * @param array 重複を含みうる並び
   * @returns 各値を最初に現れた位置にだけ残した新しい並び。等しさは `indexOf`（`===`）で
   *   見るので、中身が同じでも別のオブジェクトは重複にならず、`NaN` は 1 つも残らない
   */
  distinct<T>(array: readonly T[]): readonly T[] {
    return array.filter((item, index) => array.indexOf(item) === index);
  },

  /**
   * 並びの中で、その値と等しい要素。
   *
   * @param array 探す先の並び
   * @param value 等しい要素を探したい値
   * @returns 等しい要素があればそれ、無ければ `none`
   */
  findEqual<T>(array: readonly T[], value: unknown): Option<NonNullable<T>> {
    return Option.fromNullable(array.find((item): boolean => item === value));
  },

  /**
   * その位置へ要素を差し込んだ並び。元の並びは変えない。
   *
   * @param array 差し込む前の並び
   * @param index 差し込んだ要素が並びの中で占める位置。長さちょうどなら末尾へ足す
   * @param item 差し込む要素
   * @returns 差し込んだ新しい並び。`index` が差し込める位置でなければ（`isInsertionIndexInRange`）
   *   その指定値と長さを持つ `err`
   */
  insertAt<T>(
    array: readonly T[],
    index: number,
    item: T,
  ): Result<readonly T[], IndexOutOfRange> {
    if (!ArrayEx.isInsertionIndexInRange(array, index)) {
      return outOfRange(array, index);
    }
    return Result.ok([...array.slice(0, index), item, ...array.slice(index)]);
  },

  /**
   * その位置の要素を置き換えた並び。元の並びは変えない。
   *
   * @param array 置き換える前の並び
   * @param index 置き換える要素の位置
   * @param item 新しく置く要素
   * @returns 置き換えた新しい並び。`index` が既にある要素を指していなければ（`isIndexInRange`）
   *   その指定値と長さを持つ `err`
   */
  replaceAt<T>(
    array: readonly T[],
    index: number,
    item: T,
  ): Result<readonly T[], IndexOutOfRange> {
    if (!ArrayEx.isIndexInRange(array, index)) {
      return outOfRange(array, index);
    }
    return Result.ok([
      ...array.slice(0, index),
      item,
      ...array.slice(index + 1),
    ]);
  },

  /**
   * 要素を並びの中の別の位置へ動かした並び。元の並びは変えない。
   *
   * @param array 動かす前の並び
   * @param fromIndex 動かす要素の、動かす前の位置
   * @param toIndex 動かした要素が、動かした後の並びで占める位置
   * @returns 動かした新しい並び。どちらかの位置が既にある要素を指していなければ、`fromIndex`、
   *   `toIndex` の順に見て最初に外れた指定値と長さを持つ `err`
   */
  moveWithin<T>(
    array: readonly T[],
    fromIndex: number,
    toIndex: number,
  ): Result<readonly T[], IndexOutOfRange> {
    const invalid = [fromIndex, toIndex].find(
      (index) => !ArrayEx.isIndexInRange(array, index),
    );
    if (invalid !== undefined) {
      return outOfRange(array, invalid);
    }
    const item = array[fromIndex];
    const without = [
      ...array.slice(0, fromIndex),
      ...array.slice(fromIndex + 1),
    ];
    return Result.ok([
      ...without.slice(0, toIndex),
      item,
      ...without.slice(toIndex),
    ]);
  },
} as const;

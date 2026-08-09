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
  isIndexInRange<T>(array: readonly T[], index: number): boolean {
    return NumberEx.isNatural(index) && index < array.length;
  },

  isInsertionIndexInRange<T>(array: readonly T[], index: number): boolean {
    return NumberEx.isNatural(index) && index <= array.length;
  },

  /** 先頭の要素。空の並びには先頭が無いので `none`。 */
  first<T>(array: readonly T[]): Option<NonNullable<T>> {
    return Option.fromNullable(array[0]);
  },

  /** 末尾の要素。空の並びには末尾が無いので `none`。 */
  last<T>(array: readonly T[]): Option<NonNullable<T>> {
    return Option.fromNullable(array[array.length - 1]);
  },

  /** 先頭を除いた並び。空の並びは空のまま。 */
  dropFirst<T>(array: readonly T[]): readonly T[] {
    return array.slice(1);
  },

  /** 末尾を除いた並び。空の並びは空のまま。 */
  dropLast<T>(array: readonly T[]): readonly T[] {
    return array.slice(0, -1);
  },

  /** 重複を取り除いた並び。残るのは各値が最初に現れた位置。 */
  distinct<T>(array: readonly T[]): readonly T[] {
    return array.filter((item, index) => array.indexOf(item) === index);
  },

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

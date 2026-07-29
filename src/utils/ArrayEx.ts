import { NumberEx } from "@/utils/NumberEx";
import { Result } from "@/utils/Result";

/**
 * 配列の位置指定が範囲外だったことを表す。
 * ドメイン知識を持たないので、意味づけ（どの操作のどの引数か）は呼び出し側で与える。
 */
export type IndexOutOfRange = Readonly<{
  index: number;
  length: number;
}>;

function outOfRange<T>(
  array: readonly T[],
  index: number,
): Result<never, IndexOutOfRange> {
  return Result.err({ index, length: array.length });
}

export const ArrayEx = {
  isIndexInRange<T>(array: readonly T[], index: number): boolean {
    return NumberEx.isNatural(index) && index < array.length;
  },

  isInsertionIndexInRange<T>(array: readonly T[], index: number): boolean {
    return NumberEx.isNatural(index) && index <= array.length;
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

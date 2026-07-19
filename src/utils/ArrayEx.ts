import { NumberEx } from "@/utils/NumberEx";

export const ArrayEx = {
  isIndexInRange<T>(array: readonly T[], index: number): boolean {
    return NumberEx.isNatural(index) && index < array.length;
  },

  isInsertionIndexInRange<T>(array: readonly T[], index: number): boolean {
    return NumberEx.isNatural(index) && index <= array.length;
  },

  insertAt<T>(array: readonly T[], index: number, item: T): readonly T[] {
    if (!ArrayEx.isInsertionIndexInRange(array, index)) {
      throw new Error(
        `index ${index} is out of bounds for length ${array.length}`,
      );
    }
    return [...array.slice(0, index), item, ...array.slice(index)];
  },

  moveWithin<T>(
    array: readonly T[],
    fromIndex: number,
    toIndex: number,
  ): readonly T[] {
    if (!ArrayEx.isIndexInRange(array, fromIndex)) {
      throw new Error(
        `fromIndex ${fromIndex} is out of bounds for length ${array.length}`,
      );
    }
    if (!ArrayEx.isIndexInRange(array, toIndex)) {
      throw new Error(
        `toIndex ${toIndex} is out of bounds for length ${array.length}`,
      );
    }
    const item = array[fromIndex];
    const without = [
      ...array.slice(0, fromIndex),
      ...array.slice(fromIndex + 1),
    ];
    return [...without.slice(0, toIndex), item, ...without.slice(toIndex)];
  },
} as const;

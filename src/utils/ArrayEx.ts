export const ArrayEx = {
  isIndexInRange<T>(array: readonly T[], index: number): boolean {
    return index >= 0 && index < array.length;
  },

  isInsertionIndexInRange<T>(array: readonly T[], index: number): boolean {
    return index >= 0 && index <= array.length;
  },
} as const;

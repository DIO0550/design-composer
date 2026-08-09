/** 数値の性質を答える汎用操作。 */
export const NumberEx = {
  isNatural(value: number): boolean {
    return Number.isInteger(value) && value >= 0;
  },
} as const;

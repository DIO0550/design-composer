export const NumberEx = {
  isNatural(value: number): boolean {
    return Number.isInteger(value) && value >= 0;
  },
} as const;

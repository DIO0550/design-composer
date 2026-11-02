/** `typeof` が `"object"` になる値に対する汎用操作。 */
export const ObjectEx = {
  /**
   * その値が `null` でないオブジェクトか。配列も含め、関数は含めない。
   *
   * @param value 判定する値
   * @returns `typeof` が `"object"` で `null` でなければ true。真の側では値をキーで引ける
   */
  isObject(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === "object" && value !== null;
  },
} as const;

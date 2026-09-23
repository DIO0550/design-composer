/** 集合に対する汎用操作。 */
export const SetEx = {
  /**
   * 値の出入りを反転した新しい集合。
   *
   * @param set 反転する前の集合。変えない
   * @param value 出入りを反転する値
   * @returns `value` が入っていれば取り除き、入っていなければ足した新しい集合
   */
  toggle<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
    const next = new Set(set);
    // delete が true を返したのは入っていたときなので、その場合は足さない
    if (!next.delete(value)) {
      next.add(value);
    }
    return next;
  },
} as const;

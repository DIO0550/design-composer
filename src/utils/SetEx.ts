/** 集合に対する汎用操作。 */
export const SetEx = {
  /**
   * 値の出入りを反転した新しい集合。入っていれば取り除き、入っていなければ足す。
   * 元の集合は変えない（rules/coding.md「引数で受け取った値を変更しない」）。
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

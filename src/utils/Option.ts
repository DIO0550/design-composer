/** 値がある状態。 */
export type Some<T> = Readonly<{
  some: true;
  value: T;
}>;

/** 値が無い状態。 */
export type None = Readonly<{
  some: false;
}>;

/**
 * 値が無いことがありうる処理の戻り値（rules/coding.md「エラーと不在の表現」）。
 * `some` で分岐すると、ある場合だけ `value` が読める。
 */
export type Option<T> = Some<T> | None;

/** 不在は状態を持たないので、生成せず 1 つを共有する。 */
const none: None = Object.freeze({ some: false as const });

/** `Option` の生成と連鎖。 */
export const Option = {
  none,

  some<T>(value: NonNullable<T>): Some<NonNullable<T>> {
    return Object.freeze({ some: true as const, value });
  },

  fromNullable<T>(value: T | null | undefined): Option<NonNullable<T>> {
    return value != null ? Option.some(value) : none;
  },

  map<T, U>(option: Option<T>, fn: (value: T) => U): Option<NonNullable<U>> {
    return option.some ? Option.fromNullable(fn(option.value)) : none;
  },

  flatMap<T, U>(option: Option<T>, fn: (value: T) => Option<U>): Option<U> {
    return option.some ? fn(option.value) : none;
  },

  unwrapOr<T>(option: Option<T>, defaultValue: T): T {
    return option.some ? option.value : defaultValue;
  },

  /**
   * Some の値を取り出す。None の場合は例外を投げる。
   * 分岐せず値を前提にしてよいのは、失敗をそのままテストの失敗にしたいテストコードだけ
   * （`Result.unwrap` と同じ位置づけ / rules/coding.md）。
   */
  unwrap<T>(option: Option<T>): T {
    if (!option.some) {
      throw new Error("cannot unwrap a None option");
    }
    return option.value;
  },
} as const;

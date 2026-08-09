/** 成功した結果。処理が返した値を持つ。 */
export type Ok<T> = Readonly<{
  ok: true;
  value: T;
}>;

/** 失敗した結果。失敗の理由を持つ。 */
export type Err<E> = Readonly<{
  ok: false;
  error: E;
}>;

/**
 * 失敗しうる処理の戻り値（rules/coding.md「エラーと不在の表現」）。
 * `ok` で分岐すると、成功なら `value`、失敗なら `error` だけが読める。
 */
export type Result<T, E> = Ok<T> | Err<E>;

/** `Result` の生成と連鎖。 */
export const Result = {
  ok<T>(value: T): Ok<T> {
    return Object.freeze({ ok: true as const, value });
  },

  err<E>(error: E): Err<E> {
    return Object.freeze({ ok: false as const, error });
  },

  map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    return result.ok ? Result.ok(fn(result.value)) : result;
  },

  flatMap<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>,
  ): Result<U, E> {
    return result.ok ? fn(result.value) : result;
  },

  mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    return result.ok ? result : Result.err(fn(result.error));
  },

  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.ok ? result.value : defaultValue;
  },

  /** Ok の値を取り出す。Err の場合は例外を投げる。 */
  unwrap<T, E>(result: Result<T, E>): T {
    if (!result.ok) {
      throw new Error(`cannot unwrap an Err result: ${String(result.error)}`);
    }
    return result.value;
  },
} as const;

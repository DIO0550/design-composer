export type Ok<T> = Readonly<{
  ok: true;
  value: T;
}>;

export type Err<E> = Readonly<{
  ok: false;
  error: E;
}>;

export type Result<T, E> = Ok<T> | Err<E>;

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

  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.ok ? result.value : defaultValue;
  },
} as const;

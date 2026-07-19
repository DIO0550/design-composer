export type Some<T> = Readonly<{
  some: true;
  value: T;
}>;

export type None = Readonly<{
  some: false;
}>;

export type Option<T> = Some<T> | None;

const none: None = Object.freeze({ some: false as const });

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
} as const;

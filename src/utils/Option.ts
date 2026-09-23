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
 * `Option.isSome` で分岐すると、ある場合だけ `value` が読める。
 */
export type Option<T> = Some<T> | None;

/** 不在は状態を持たないので、生成せず 1 つを共有する。 */
const none: None = Object.freeze({ some: false as const });

/** `Option` の生成と連鎖。 */
export const Option = {
  none,

  /**
   * 値を持つ `Option`。器を凍結して返す（`value` 自体は凍結しない）。
   *
   * @param value 持たせる値
   * @returns `value` を持つ `some`
   */
  some<T>(value: NonNullable<T>): Some<NonNullable<T>> {
    return Object.freeze({ some: true as const, value });
  },

  /**
   * `null` / `undefined` を不在として読み替える。
   *
   * @param value 不在を `null` / `undefined` で表している値
   * @returns `null` / `undefined` なら `none`。それ以外は `0` や `""` も含めて `some`
   */
  fromNullable<T>(value: T | null | undefined): Option<NonNullable<T>> {
    return value != null ? Option.some(value) : none;
  },

  /**
   * 値があれば変換する。
   *
   * @param option 変換したい値。`none` でもよい
   * @param fn 値があるときだけ呼ぶ変換
   * @returns `fn` の戻り値を持つ `some`。`option` が `none` のとき（`fn` は呼ばない）と、
   *   `fn` が `null` / `undefined` を返したときは `none`
   */
  map<T, U>(option: Option<T>, fn: (value: T) => U): Option<NonNullable<U>> {
    return option.some ? Option.fromNullable(fn(option.value)) : none;
  },

  /**
   * 値があれば、不在になりうる次の処理へ繋ぐ。
   *
   * @param option 次の処理へ渡したい値。`none` でもよい
   * @param fn 値があるときだけ呼ぶ、不在になりうる処理
   * @returns `fn` の戻り値そのもの。`option` が `none` なら `fn` を呼ばずに `none`
   */
  flatMap<T, U>(option: Option<T>, fn: (value: T) => Option<U>): Option<U> {
    return option.some ? fn(option.value) : none;
  },

  /**
   * 値があればそれ、無ければ既定値。
   *
   * @param option 先に見る `Option`
   * @param defaultValue `option` が `none` のときに答える値
   * @returns `option` の値。`none` なら `defaultValue`
   */
  unwrapOr<T>(option: Option<T>, defaultValue: T): T {
    return option.some ? option.value : defaultValue;
  },

  /**
   * 値があればそれ、無ければ代わりの `Option`。
   *
   * @param option 先に見るほう
   * @param fallback `option` が `none` のときに答えるほう
   * @returns `option` が値を持てばそれ。持たなければ `fallback` をそのまま返すので、
   *   両方 `none` なら `none`
   */
  or<T>(option: Option<T>, fallback: Option<T>): Option<T> {
    return option.some ? option : fallback;
  },

  /**
   * 値を持っているか。
   *
   * 在／不在の判定はすべてここを通す。判別子（`some`）を直接読むのはこのファイルの中
   * だけにして、`Option` がどう表現されているかを知る場所を定義元 1 つに閉じている。
   *
   * @param option 中身を見る `Option`
   * @returns 値を持っていれば `true`。`none` なら `false`
   */
  isSome<T>(option: Option<T>): option is Some<T> {
    return option.some;
  },

  /**
   * その値を持っているか。
   *
   * @param option 中身を見る `Option`
   * @param value 持っていてほしい値
   * @returns 値を持っていて、それが `value` と等しければ `true`。`none` なら `false`
   */
  contains<T>(option: Option<T>, value: T): boolean {
    return option.some && option.value === value;
  },

  /**
   * Some の値を取り出す。None の場合は例外を投げる。
   * 分岐せず値を前提にしてよいのは、失敗をそのままテストの失敗にしたいテストコードだけ
   * （`Result.unwrap` と同じ位置づけ / rules/coding.md）。
   *
   * @param option 値を持っているはずの `Option`
   * @returns `option` の値
   * @throws `option` が `none` のとき
   */
  unwrap<T>(option: Option<T>): T {
    if (!option.some) {
      throw new Error("cannot unwrap a None option");
    }
    return option.value;
  },
} as const;

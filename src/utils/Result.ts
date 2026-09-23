/** 成功した結果。処理が返した値を持つ。 */
export type Ok<T> = Readonly<{
  ok: true;
  value: T;
}>;

/** 失敗した結果。 */
export type Err<E> = Readonly<{
  ok: false;
  error: E;
}>;

/**
 * 失敗しうる処理の戻り値（rules/coding.md「エラーと不在の表現」）。
 * `Result.isOk` で分岐すると、成功なら `value`、失敗なら `error` だけが読める。
 */
export type Result<T, E> = Ok<T> | Err<E>;

/** `Result` の生成と連鎖。 */
export const Result = {
  /**
   * 成功した結果。器を凍結して返す（`value` 自体は凍結しない）。
   *
   * @param value 処理が返す値
   * @returns `value` を持つ `ok`
   */
  ok<T>(value: T): Ok<T> {
    return Object.freeze({ ok: true as const, value });
  },

  /**
   * 失敗した結果。器を凍結して返す（`error` 自体は凍結しない）。
   *
   * @param error 呼び出し側が分岐に使う、失敗の理由
   * @returns `error` を持つ `err`
   */
  err<E>(error: E): Err<E> {
    return Object.freeze({ ok: false as const, error });
  },

  /**
   * 成功していれば値を変換する。
   *
   * @param result 変換したい値。失敗でもよい
   * @param fn 成功しているときだけ呼ぶ変換
   * @returns `fn` の戻り値を持つ `ok`。`result` が失敗なら `fn` を呼ばずに `result` のまま
   */
  map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    return result.ok ? Result.ok(fn(result.value)) : result;
  },

  /**
   * 成功していれば、失敗しうる次の処理へ繋ぐ。
   *
   * @param result 次の処理へ渡したい値。失敗でもよい
   * @param fn 成功しているときだけ呼ぶ、失敗しうる処理
   * @returns `fn` の戻り値そのもの。`result` が失敗なら `fn` を呼ばずに `result` のまま
   */
  flatMap<T, U, E>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>,
  ): Result<U, E> {
    return result.ok ? fn(result.value) : result;
  },

  /**
   * 失敗していれば理由を変換する。
   *
   * @param result 理由を変換したい失敗。成功でもよい
   * @param fn 失敗しているときだけ呼ぶ、理由の変換
   * @returns `fn` の戻り値を理由に持つ `err`。`result` が成功なら `fn` を呼ばずに `result` のまま
   */
  mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    return result.ok ? result : Result.err(fn(result.error));
  },

  /**
   * 成功していれば値、失敗していれば既定値。失敗の理由は捨てる。
   *
   * @param result 先に見る結果
   * @param defaultValue `result` が失敗のときに答える値
   * @returns `result` の値。失敗なら `defaultValue`
   */
  unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
    return result.ok ? result.value : defaultValue;
  },

  /**
   * 成功しているか。
   *
   * 成否の判定はすべてここを通す。判別子（`ok`）を直接読むのはこのファイルの中だけに
   * して、`Result` がどう表現されているかを知る場所を定義元 1 つに閉じている。
   *
   * @param result 中身を見る `Result`
   * @returns 成功していれば `true`。失敗なら `false`
   */
  isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.ok;
  },

  /**
   * Ok の値を取り出す。Err の場合は例外を投げる。
   *
   * @param result 成功しているはずの結果
   * @returns `result` の値
   * @throws `result` が失敗のとき。メッセージに失敗の理由を `String` で添える
   */
  unwrap<T, E>(result: Result<T, E>): T {
    if (!result.ok) {
      throw new Error(`cannot unwrap an Err result: ${String(result.error)}`);
    }
    return result.value;
  },
} as const;

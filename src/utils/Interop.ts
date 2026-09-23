import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * `Result` と `Option` の相互変換。
 * どちらの型にも属さない橋渡しなので、両方を import できるここに置く。
 */
export const Interop = {
  /**
   * 成功の値だけを残して `Option` にする。
   *
   * @param result 変換元の結果
   * @returns 成功ならその値の `some`。失敗なら `none`（エラーの中身は捨てる）
   */
  toOption<T extends NonNullable<unknown>, E>(result: Result<T, E>): Option<T> {
    return Result.isOk(result) ? Option.some(result.value) : Option.none;
  },

  /**
   * 不在を失敗として扱う `Result` にする。
   *
   * @param option 変換元
   * @param error `option` が `none` のときに失敗として持たせる値
   * @returns 値があればその値の `ok`。`none` なら `error` を持つ `err`
   */
  toResult<T, E>(option: Option<T>, error: E): Result<T, E> {
    return Option.isSome(option) ? Result.ok(option.value) : Result.err(error);
  },
} as const;

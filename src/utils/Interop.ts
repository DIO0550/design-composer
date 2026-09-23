import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * `Result` と `Option` の相互変換。
 * どちらの型にも属さない橋渡しなので、両方を import できるここに置く。
 */
export const Interop = {
  /**
   * 成功した値だけを残す。
   *
   * @param result 読み替える結果。成功・失敗のどちらでもよい
   * @returns 成功ならその値を持つ `some`。失敗なら理由を捨てて `none`
   */
  toOption<T extends NonNullable<unknown>, E>(result: Result<T, E>): Option<T> {
    return Result.isOk(result) ? Option.some(result.value) : Option.none;
  },

  /**
   * 不在を失敗として読み替える。
   *
   * @param option 読み替える値。`none` でもよい
   * @param error 不在だったときの失敗の理由
   * @returns 値があればそれを持つ `ok`。`none` なら `error` を持つ `err`
   */
  toResult<T, E>(option: Option<T>, error: E): Result<T, E> {
    return Option.isSome(option) ? Result.ok(option.value) : Result.err(error);
  },
} as const;

import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

export const Interop = {
  toOption<T extends NonNullable<unknown>, E>(result: Result<T, E>): Option<T> {
    return result.ok ? Option.some(result.value) : Option.none;
  },

  toResult<T, E>(option: Option<T>, error: E): Result<T, E> {
    return option.some ? Result.ok(option.value) : Result.err(error);
  },
} as const;

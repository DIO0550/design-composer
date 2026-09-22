import { expect, expectTypeOf, test } from "vitest";
import { Option } from "../Option";

/*
 * 絞り込みが効くことを固定する（`rules/coding.md`「型レベルの保証が仕様の一部であるとき
 * は `expectTypeOf` で退行を検知する」）。効かなくなると `isSome` は真偽を答えるだけの
 * 関数になり、通した先で `value` が読めなくなる。
 */

test("isSome が真の側では値を読める型に絞られる", () => {
  // `Option.some(42)` を直に入れると初期化子の型で絞られ、`isSome` が絞り込まなくても
  // `value` が読めてしまう。`fromNullable` は union を返すのでそれが起きない。
  const option = Option.fromNullable<number>(42);

  const value = Option.isSome(option) ? option.value : 0;

  expectTypeOf(value).toEqualTypeOf<number>();
  expect(value).toBe(42);
});

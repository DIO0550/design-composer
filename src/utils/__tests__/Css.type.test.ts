import { expectTypeOf, test } from "vitest";
import type { Css, Px } from "../Css";

test("px 単位付きの長さは単位なしの文字列を受け付けない", () => {
  expectTypeOf<"16px">().toExtend<Px>();
  expectTypeOf<"16">().not.toExtend<Px>();
  expectTypeOf<"16rem">().not.toExtend<Px>();
});

test("px 変換はただの string ではなく px 付きの長さを返す", () => {
  expectTypeOf<ReturnType<typeof Css.px>>().toEqualTypeOf<Px>();
});

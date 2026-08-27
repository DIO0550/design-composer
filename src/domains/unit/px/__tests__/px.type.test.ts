import { expectTypeOf, test } from "vitest";
import type { Px, Px as PxCompanion } from "../index";

test("px 単位付きの長さは単位なしや別単位の文字列を受け付けない", () => {
  expectTypeOf<"16px">().toExtend<Px>();
  expectTypeOf<"16">().not.toExtend<Px>();
  expectTypeOf<"16rem">().not.toExtend<Px>();
});

test("長さの生成はただの string ではなく px 単位付きの長さを返す", () => {
  expectTypeOf<ReturnType<typeof PxCompanion.create>>().toEqualTypeOf<Px>();
});

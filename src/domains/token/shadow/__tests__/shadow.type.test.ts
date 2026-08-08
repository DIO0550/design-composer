import { expectTypeOf, test } from "vitest";
import type { ShadowField, ShadowToken } from "../index";

test("ShadowField は ShadowToken が持つフィールドと完全に一致する", () => {
  expectTypeOf<ShadowField>().toEqualTypeOf<keyof Required<ShadowToken>>();
});

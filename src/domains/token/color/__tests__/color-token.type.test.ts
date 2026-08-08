import { expectTypeOf, test } from "vitest";
import type { Rgb } from "../index";

test("RGB は素の文字列を受け付けない", () => {
  expectTypeOf<string>().not.toEqualTypeOf<Rgb>();
  expectTypeOf<Rgb>().toEqualTypeOf<`#${string}`>();
});

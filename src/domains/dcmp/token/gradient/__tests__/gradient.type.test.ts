import { expectTypeOf, test } from "vitest";
import type { GradientShape } from "../index";

test("色を並べる形は linear の1つだけになる", () => {
  expectTypeOf<GradientShape>().toEqualTypeOf<"linear">();
});

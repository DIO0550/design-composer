import { expectTypeOf, test } from "vitest";
import type { PrimitiveType, PrimitiveTypes } from "../index";

test("primitive の型を名前で指すキーは、型の綴りを大文字始まりにしたものと完全に一致する", () => {
  expectTypeOf<keyof typeof PrimitiveTypes>().toEqualTypeOf<
    Capitalize<PrimitiveType>
  >();
});

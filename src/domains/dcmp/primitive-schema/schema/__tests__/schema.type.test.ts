import { expectTypeOf, test } from "vitest";
import type { RefOwnPropName } from "@/domains/dcmp/node";
import type { PrimitiveType, PrimitiveTypes, RefNodeSchema } from "../index";

test("primitive の型を名前で指すキーは、型の綴りを大文字始まりにしたものと完全に一致する", () => {
  expectTypeOf<keyof typeof PrimitiveTypes>().toEqualTypeOf<
    Capitalize<PrimitiveType>
  >();
});

test("部品インスタンスのスキーマが宣言する prop は、参照ノードが自身の値として持てる prop と完全に一致する", () => {
  expectTypeOf<
    keyof typeof RefNodeSchema.props
  >().toEqualTypeOf<RefOwnPropName>();
});

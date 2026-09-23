import { expectTypeOf, test } from "vitest";
import type {
  GradientShape,
  GradientToken as GradientTokenCompanion,
  LinearGradientValue,
} from "../index";

test("色を並べる形は linear の1つだけになる", () => {
  expectTypeOf<GradientShape>().toEqualTypeOf<"linear">();
});

test("グラデーションの CSS 値は角度が数値の linear-gradient 以外を受け付けない", () => {
  expectTypeOf<"linear-gradient(90deg, #3b82f6 0%)">().toExtend<LinearGradientValue>();
  expectTypeOf<"linear-gradient(topdeg, #3b82f6 0%)">().not.toExtend<LinearGradientValue>();
  expectTypeOf<"90deg, #3b82f6 0%">().not.toExtend<LinearGradientValue>();
});

test("CSS 値の生成はただの string ではなくグラデーションの CSS 値を返す", () => {
  expectTypeOf<
    ReturnType<typeof GradientTokenCompanion.cssValue>
  >().toEqualTypeOf<LinearGradientValue>();
});

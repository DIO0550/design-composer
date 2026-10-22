import { expectTypeOf, test } from "vitest";
import type {
  GradientShape,
  GradientStop,
  LinearGradientValue,
} from "../index";

test("色を並べる形は linear の1つだけになる", () => {
  expectTypeOf<GradientShape>().toEqualTypeOf<"linear">();
});

test("グラデーションの CSS 値は角度を deg で書いた linear-gradient() の綴りに限られる", () => {
  expectTypeOf<"linear-gradient(90deg, #000000 0%, #ffffff 100%)">().toExtend<LinearGradientValue>();
  expectTypeOf<"radial-gradient(90deg, #000000 0%, #ffffff 100%)">().not.toExtend<LinearGradientValue>();
  expectTypeOf<"linear-gradient(90, #000000 0%, #ffffff 100%)">().not.toExtend<LinearGradientValue>();
  expectTypeOf<"linear-gradient(abcdeg, #000000 0%, #ffffff 100%)">().not.toExtend<LinearGradientValue>();
});

test("色の変わり目の CSS 値は色のあとに位置を % で書いた綴りに限られる", () => {
  type ColorStopValue = ReturnType<typeof GradientStop.cssValue>;
  expectTypeOf<"#000000 50%">().toExtend<ColorStopValue>();
  expectTypeOf<"#000000 50">().not.toExtend<ColorStopValue>();
  expectTypeOf<"#000000 abc%">().not.toExtend<ColorStopValue>();
});

import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { GradientStop, GradientToken } from "../index";

/** 値域を満たしている色の変わり目の並び。件数の検査だけを見たいときに使う。 */
function setupStops(): readonly GradientStop[] {
  return [
    { color: "#3b82f6", ratio: 0 },
    { color: "#1d4ed8", ratio: 1 },
  ];
}

test("比率が0未満の色の変わり目は作れない", () => {
  expect(GradientStop.create("#3b82f6", -0.1)).toEqual(Option.none);
});

test("比率が1を超える色の変わり目は作れない", () => {
  expect(GradientStop.create("#3b82f6", 1.1)).toEqual(Option.none);
});

test("比率が0の色の変わり目は作れる", () => {
  expect(GradientStop.create("#3b82f6", 0)).toEqual(
    Option.some({ color: "#3b82f6", ratio: 0 }),
  );
});

test("比率が1の色の変わり目は作れる", () => {
  expect(GradientStop.create("#3b82f6", 1)).toEqual(
    Option.some({ color: "#3b82f6", ratio: 1 }),
  );
});

test("比率が数値として読めない色の変わり目は作れない", () => {
  expect(GradientStop.create("#3b82f6", Number.NaN)).toEqual(Option.none);
});

test("色の変わり目が1件ではグラデーションを作れない", () => {
  const stops = [{ color: "#3b82f6", ratio: 0 }];

  expect(GradientToken.create("linear", 90, stops)).toEqual(Option.none);
});

test("色の変わり目が0件ではグラデーションを作れない", () => {
  expect(GradientToken.create("linear", 90, [])).toEqual(Option.none);
});

test("角度が数値として読めないグラデーションは作れない", () => {
  expect(GradientToken.create("linear", Number.NaN, setupStops())).toEqual(
    Option.none,
  );
});

test("1周を超える角度のグラデーションは作れる", () => {
  /* docs/04-tokens.md「gradients」は角度に値域を置いていない。450 度は「1 周と 90 度」。 */
  const stops = setupStops();

  expect(GradientToken.create("linear", 450, stops)).toEqual(
    Option.some({ shape: "linear", angle: 450, stops }),
  );
});

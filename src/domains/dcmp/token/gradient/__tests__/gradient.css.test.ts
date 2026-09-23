import { expect, test } from "vitest";
import { GradientStop, GradientToken } from "../index";

test("linear のグラデーションは角度と色の変わり目を並べた綴りになる", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3b82f6", ratio: 0 },
      { color: "#2563eb", ratio: 0.5 },
      { color: "#1d4ed8", ratio: 1 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
  );
});

test("比率は100倍した%になり、二進小数の端数を残さない", () => {
  expect(GradientStop.cssValue({ color: "#3b82f6", ratio: 0.007 })).toBe(
    "#3b82f6 0.7%",
  );
});

test("小数第4位より下の比率は四捨五入される", () => {
  expect(GradientStop.cssValue({ color: "#3b82f6", ratio: 0.1234567 })).toBe(
    "#3b82f6 12.3457%",
  );
});

test("色の変わり目は持っている並びのまま綴られる", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#1d4ed8", ratio: 0.75 },
      { color: "#3b82f6", ratio: 0.25 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #1d4ed8 75%, #3b82f6 25%)",
  );
});

test("alpha 付きの色は8桁のまま綴られる", () => {
  expect(GradientStop.cssValue({ color: "#0000001a", ratio: 0 })).toBe(
    "#0000001a 0%",
  );
});

test("0〜1の外の比率もそのまま%になる", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3b82f6", ratio: -0.5 },
      { color: "#1d4ed8", ratio: 2 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #3b82f6 -50%, #1d4ed8 200%)",
  );
});

test("色の変わり目が0件でも綴りは作る", () => {
  /* 2 件に満たない値は `create` を通らないので、読み込んだ形を直に組む。 */
  const gradient = { shape: "linear", angle: 90, stops: [] } as const;

  expect(GradientToken.cssValue(gradient)).toBe("linear-gradient(90deg, )");
});

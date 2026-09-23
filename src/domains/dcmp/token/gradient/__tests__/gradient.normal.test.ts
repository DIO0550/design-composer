import { expect, test } from "vitest";
import { GradientToken } from "../index";

test("グラデーションを CSS の値にすると角度・色・位置が仕様の順で並ぶ", () => {
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

test("二進小数で割り切れない ratio でも位置は % の綴りが崩れない", () => {
  const gradient = {
    shape: "linear",
    angle: 0,
    stops: [
      { color: "#000000", ratio: 0.007 },
      { color: "#ffffff", ratio: 0.009 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(0deg, #000000 0.7%, #ffffff 0.9%)",
  );
});

test("小数の細かい ratio は % の小数第 4 位まで残る", () => {
  const gradient = {
    shape: "linear",
    angle: 0,
    stops: [
      { color: "#000000", ratio: 0.123456 },
      { color: "#ffffff", ratio: 0.987654 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(0deg, #000000 12.3456%, #ffffff 98.7654%)",
  );
});

test("グラデーションを正規化すると stop の色が小文字の hex になる", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3B82F6", ratio: 0 },
      { color: "#1D4ED8", ratio: 1 },
    ],
  } as const;

  expect(
    GradientToken.normalized(gradient).stops.map((stop) => stop.color),
  ).toEqual(["#3b82f6", "#1d4ed8"]);
});

test("正規化しても stop の並びは変わらない", () => {
  /* ratio を降順にしておく。昇順だと ratio で並べ替える実装と区別が付かない。 */
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#111111", ratio: 1 },
      { color: "#222222", ratio: 0.75 },
      { color: "#333333", ratio: 0.25 },
      { color: "#444444", ratio: 0 },
    ],
  } as const;

  expect(
    GradientToken.normalized(gradient).stops.map((stop) => stop.color),
  ).toEqual(["#111111", "#222222", "#333333", "#444444"]);
});

test("正規化は stop の色以外を変えない", () => {
  const gradient = {
    shape: "linear",
    angle: 45,
    stops: [{ color: "#ABCDEF", ratio: 0 }],
  } as const;

  const normalized = GradientToken.normalized(gradient);

  expect(normalized.angle).toBe(45);
  expect(normalized.shape).toBe("linear");
});

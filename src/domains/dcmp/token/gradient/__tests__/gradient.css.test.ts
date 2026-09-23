import { expect, test } from "vitest";
import { GradientToken } from "../index";

test("角度を deg、色の変わり目を色と % の位置にした linear-gradient になる", () => {
  const gradient = {
    shape: "linear",
    angle: 135,
    stops: [
      { color: "#3b82f6", ratio: 0.25 },
      { color: "#1d4ed8", ratio: 0.75 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(135deg, #3b82f6 25%, #1d4ed8 75%)",
  );
});

test("始点の比率 0 は小数の桁を付けずに 0% になる", () => {
  const gradient = {
    shape: "linear",
    angle: 0,
    stops: [
      { color: "#3b82f6", ratio: 0 },
      { color: "#1d4ed8", ratio: 0.5 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(0deg, #3b82f6 0%, #1d4ed8 50%)",
  );
});

test("終点の比率 1 は小数の桁を付けずに 100% になる", () => {
  const gradient = {
    shape: "linear",
    angle: 180,
    stops: [
      { color: "#3b82f6", ratio: 0.5 },
      { color: "#1d4ed8", ratio: 1 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(180deg, #3b82f6 50%, #1d4ed8 100%)",
  );
});

test("比率を % にしたときの二進小数の誤差は綴りに出ない", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3b82f6", ratio: 0.007 },
      { color: "#1d4ed8", ratio: 1 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #3b82f6 0.7%, #1d4ed8 100%)",
  );
});

test("比率の % は小数 4 桁で丸められる", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3b82f6", ratio: 0.333333333 },
      { color: "#1d4ed8", ratio: 1 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #3b82f6 33.3333%, #1d4ed8 100%)",
  );
});

test("比率の % は小数 4 桁までは丸めずに残る", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3b82f6", ratio: 0.123456 },
      { color: "#1d4ed8", ratio: 1 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #3b82f6 12.3456%, #1d4ed8 100%)",
  );
});

test("色の変わり目は比率の順ではなく書かれた順のまま並ぶ", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#1d4ed8", ratio: 1 },
      { color: "#3b82f6", ratio: 0 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #1d4ed8 100%, #3b82f6 0%)",
  );
});

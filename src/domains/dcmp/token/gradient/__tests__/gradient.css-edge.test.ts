import { expect, test } from "vitest";
import { GradientToken } from "../index";

test("1 を超える比率は範囲へ収めずそのまま % になる", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3b82f6", ratio: 0 },
      { color: "#1d4ed8", ratio: 1.5 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #3b82f6 0%, #1d4ed8 150%)",
  );
});

test("負の比率は範囲へ収めずそのまま負の % になる", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3b82f6", ratio: -0.1 },
      { color: "#1d4ed8", ratio: 1 },
    ],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #3b82f6 -10%, #1d4ed8 100%)",
  );
});

test("色の変わり目が 1 件でも補わずそのまま綴る", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [{ color: "#3b82f6", ratio: 0 }],
  } as const;

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #3b82f6 0%)",
  );
});

test("色の変わり目が 0 件でも補わずそのまま綴る", () => {
  const gradient = { shape: "linear", angle: 90, stops: [] } as const;

  expect(GradientToken.cssValue(gradient)).toBe("linear-gradient(90deg, )");
});

import { expect, test } from "vitest";
import { GradientToken } from "../index";

test("色が正規形の hex でない色の変わり目だけが、その添字で集まる", () => {
  const gradient: GradientToken = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3b82f6", ratio: 0 },
      { color: "red", ratio: 0.5 },
      { color: "#1d4ed8", ratio: 1 },
    ],
  };

  expect(GradientToken.collectInvalidColorStopIndexes(gradient)).toEqual([1]);
});

test("色の変わり目の色がすべて正規形の hex なら、何も集まらない", () => {
  const gradient: GradientToken = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3b82f6", ratio: 0 },
      { color: "#1d4ed880", ratio: 1 },
    ],
  };

  expect(GradientToken.collectInvalidColorStopIndexes(gradient)).toEqual([]);
});

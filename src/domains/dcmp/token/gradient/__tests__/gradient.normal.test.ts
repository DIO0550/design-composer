import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { GradientStop, GradientToken } from "../index";

test("形と角度と2件以上の色の変わり目を渡すとグラデーションが作れる", () => {
  const stops = [
    { color: "#3b82f6", ratio: 0 },
    { color: "#1d4ed8", ratio: 1 },
  ];

  expect(GradientToken.create("linear", 90, stops)).toEqual(
    Option.some({ shape: "linear", angle: 90, stops }),
  );
});

test("色と比率を渡すと色の変わり目が作れる", () => {
  expect(GradientStop.create("#3b82f6", 0.25)).toEqual(
    Option.some({ color: "#3b82f6", ratio: 0.25 }),
  );
});

test("正規形へ倒すと色の変わり目の色が小文字の hex になる", () => {
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

test("正規形へ倒しても色の変わり目の比率と並びは変わらない", () => {
  const gradient = {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#1D4ED8", ratio: 0.75 },
      { color: "#3B82F6", ratio: 0.25 },
    ],
  } as const;

  expect(
    GradientToken.normalized(gradient).stops.map((stop) => stop.ratio),
  ).toEqual([0.75, 0.25]);
});

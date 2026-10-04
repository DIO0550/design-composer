import { expect, test } from "vitest";
import { Layout, Layouts } from "../index";

test("自由配置の親の下で両軸とも fill なら幅・高さの順で返る", () => {
  expect(
    Layout.collectFillAxesInFreeParent(Layouts.Free, {
      widthMode: "fill",
      heightMode: "fill",
    }),
  ).toEqual(["width", "height"]);
});

test("横並びの親の下では両軸とも fill でも軸は返らない", () => {
  expect(
    Layout.collectFillAxesInFreeParent(Layouts.Row, {
      widthMode: "fill",
      heightMode: "fill",
    }),
  ).toEqual([]);
});

test("縦並びの親の下では両軸とも fill でも軸は返らない", () => {
  expect(
    Layout.collectFillAxesInFreeParent(Layouts.Column, {
      widthMode: "fill",
      heightMode: "fill",
    }),
  ).toEqual([]);
});

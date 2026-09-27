import { expect, test } from "vitest";
import { Layout, Layouts } from "../index";

test("自由配置の親の下で幅だけ fill なら幅の軸だけが返る", () => {
  expect(
    Layout.collectFillAxesInFreeParent(Layouts.Free, {
      widthMode: "fill",
      heightMode: "hug",
    }),
  ).toEqual(["width"]);
});

test("自由配置の親の下で高さだけ fill なら高さの軸だけが返る", () => {
  expect(
    Layout.collectFillAxesInFreeParent(Layouts.Free, {
      widthMode: "fixed",
      width: 120,
      heightMode: "fill",
    }),
  ).toEqual(["height"]);
});

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

test("自由配置の親の下でも fill 以外のサイズ指定の軸は返らない", () => {
  expect(
    Layout.collectFillAxesInFreeParent(Layouts.Free, {
      widthMode: "fixed",
      width: 120,
      heightMode: "hug",
    }),
  ).toEqual([]);
});

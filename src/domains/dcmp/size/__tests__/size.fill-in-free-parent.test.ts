import { expect, test } from "vitest";
import { Layouts } from "@/domains/dcmp/layout";
import { Size } from "../index";

test("自由配置の親の下で両軸とも fill なら幅・高さの順で返る", () => {
  expect(
    Size.collectFillAxesInFreeParent(
      { widthMode: "fill", heightMode: "fill" },
      Layouts.Free,
    ),
  ).toEqual(["width", "height"]);
});

test("横並びの親の下では両軸とも fill でも軸は返らない", () => {
  expect(
    Size.collectFillAxesInFreeParent(
      { widthMode: "fill", heightMode: "fill" },
      Layouts.Row,
    ),
  ).toEqual([]);
});

test("縦並びの親の下では両軸とも fill でも軸は返らない", () => {
  expect(
    Size.collectFillAxesInFreeParent(
      { widthMode: "fill", heightMode: "fill" },
      Layouts.Column,
    ),
  ).toEqual([]);
});

import { expect, test } from "vitest";
import { PropEdit } from "@/domains/dcmp/node";
import { PrimitiveTypes } from "@/domains/dcmp/primitive-schema";
import { ResolvedProps } from "@/domains/dcmp/resolved-props";
import { Size } from "../index";

test("幅だけ fill なら幅の軸だけが返る", () => {
  expect(
    Size.collectFillAxes({ widthMode: "fill", heightMode: "hug" }),
  ).toEqual(["width"]);
});

test("高さだけ fill なら高さの軸だけが返る", () => {
  expect(
    Size.collectFillAxes({
      widthMode: "fixed",
      width: 120,
      heightMode: "fill",
    }),
  ).toEqual(["height"]);
});

test("両軸とも fill なら幅・高さの順で返る", () => {
  expect(
    Size.collectFillAxes({ widthMode: "fill", heightMode: "fill" }),
  ).toEqual(["width", "height"]);
});

test("fill 以外のサイズ指定の軸は返らない", () => {
  expect(
    Size.collectFillAxes({ widthMode: "fixed", width: 120, heightMode: "hug" }),
  ).toEqual([]);
});

test("サイズが決まらない軸は fill として返らない", () => {
  expect(
    Size.collectFillAxes({ widthMode: "fixed", heightMode: "hug" }),
  ).toEqual([]);
});

test("どの型でも、モードを書いていない軸は既定を当てても fill にならない", () => {
  expect(
    Object.values(PrimitiveTypes).filter(
      (type) =>
        Size.collectFillAxes(ResolvedProps.resolve(type, {})).length > 0,
    ),
  ).toEqual([]);
});

test("fill を写す編集は、fill の軸のモードを fill にする", () => {
  expect(
    Size.collectFillPropEdits({ widthMode: "hug", heightMode: "fill" }),
  ).toEqual([PropEdit.set(["heightMode"], "fill")]);
});

test("fill を写す編集は、fill の軸に書かれている下限・上限を同じ値で写す", () => {
  expect(
    Size.collectFillPropEdits({
      widthMode: "fill",
      minWidth: 120,
      maxWidth: 320,
      heightMode: "hug",
      maxHeight: 80,
    }),
  ).toEqual([
    PropEdit.set(["widthMode"], "fill"),
    PropEdit.set(["minWidth"], 120),
    PropEdit.set(["maxWidth"], 320),
  ]);
});

test("fill の軸が無ければ、fill を写す編集は空", () => {
  expect(
    Size.collectFillPropEdits({ widthMode: "fixed", width: 120, minWidth: 40 }),
  ).toEqual([]);
});

test("引き伸ばされている軸のモードを持たない Text を含む並びは、その軸の幅を fill にする編集になる", () => {
  expect(
    Size.collectStretchedFillModePropEdits(
      [PrimitiveTypes.Box, PrimitiveTypes.Text],
      "width",
    ),
  ).toEqual([PropEdit.set(["widthMode"], "fill")]);
});

test("引き伸ばされている軸が高さなら、高さのモードを fill にする編集になる", () => {
  expect(
    Size.collectStretchedFillModePropEdits([PrimitiveTypes.Text], "height"),
  ).toEqual([PropEdit.set(["heightMode"], "fill")]);
});

test("全員がその軸のモードを持つ型なら、引き伸ばしを写す編集は空", () => {
  expect(
    Size.collectStretchedFillModePropEdits(
      [PrimitiveTypes.Box, PrimitiveTypes.Ellipse],
      "width",
    ),
  ).toEqual([]);
});

test("空の並びなら、引き伸ばしを写す編集は空", () => {
  expect(Size.collectStretchedFillModePropEdits([], "width")).toEqual([]);
});

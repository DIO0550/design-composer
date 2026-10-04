import { expect, test } from "vitest";
import { PropEdit } from "@/domains/dcmp/node";
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

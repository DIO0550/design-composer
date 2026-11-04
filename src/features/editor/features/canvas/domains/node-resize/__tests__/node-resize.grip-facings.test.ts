import { expect, test } from "vitest";
import { AxisEnds } from "@/domains/unit/axis";
import { SidePairs } from "@/domains/unit/side";
import { ResizeGrip } from "../index";
import { gripAt, setupResizable } from "./setup";

/*
 * 掴んだ辺から外へ進む向き（docs/06-ui.md「リサイズハンドル」の Alt / Option の距離）。
 * 掴む要素は 2 軸とも掴める（`setupResizable`）。
 */

const Right = { pair: SidePairs.Horizontal, end: AxisEnds.End };
const Left = { pair: SidePairs.Horizontal, end: AxisEnds.Start };
const Top = { pair: SidePairs.Vertical, end: AxisEnds.Start };
const Bottom = { pair: SidePairs.Vertical, end: AxisEnds.End };

test("右辺を掴むと、右へだけ進む", () => {
  expect(
    ResizeGrip.toFacings(gripAt(setupResizable(), { x: 1, y: 0.5 })),
  ).toEqual([Right]);
});

test("左辺を掴むと、左へだけ進む", () => {
  expect(
    ResizeGrip.toFacings(gripAt(setupResizable(), { x: 0, y: 0.5 })),
  ).toEqual([Left]);
});

test("上辺を掴むと、上へだけ進む", () => {
  expect(
    ResizeGrip.toFacings(gripAt(setupResizable(), { x: 0.5, y: 0 })),
  ).toEqual([Top]);
});

test("右下の角を掴むと、右と下へ進む", () => {
  expect(
    ResizeGrip.toFacings(gripAt(setupResizable(), { x: 1, y: 1 })),
  ).toEqual([Right, Bottom]);
});

test("右上の角を掴むと、右と上へ進む", () => {
  expect(
    ResizeGrip.toFacings(gripAt(setupResizable(), { x: 1, y: 0 })),
  ).toEqual([Right, Top]);
});

test("左下の角を掴むと、左と下へ進む", () => {
  expect(
    ResizeGrip.toFacings(gripAt(setupResizable(), { x: 0, y: 1 })),
  ).toEqual([Left, Bottom]);
});

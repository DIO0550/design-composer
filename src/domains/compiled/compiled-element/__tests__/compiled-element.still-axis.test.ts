import { expect, test } from "vitest";
import { Artboard } from "@/domains/dcmp/artboard";
import type { Props } from "@/domains/dcmp/node";
import { ResolvedProps } from "@/domains/dcmp/resolved-props";
import type { Axis } from "@/domains/unit/axis";
import { Option } from "@/utils/Option";
import { BoxElement } from "../index";

/**
 * Box の props から、子の始点が動かない交差軸を引く。
 *
 * @param props 設定されている props（デフォルト解決前）
 * @returns `BoxElement.stillCrossAxis` の答え
 */
function stillAxisOf(props: Props): Option<Axis> {
  return BoxElement.stillCrossAxis(ResolvedProps.resolve("Box", props));
}

test("幅が固定の縦並びの Box では、子の幅の始点が動かない", () => {
  expect(
    stillAxisOf({ layout: "column", widthMode: "fixed", width: 320 }),
  ).toEqual(Option.some("width"));
});

test("高さが固定の横並びの Box では、子の高さの始点が動かない", () => {
  expect(
    stillAxisOf({ layout: "row", heightMode: "fixed", height: 200 }),
  ).toEqual(Option.some("height"));
});

test("artboard の子は幅の始点が動かない", () => {
  const artboard = Artboard.create({ name: "home", width: 375, height: 812 });

  expect(BoxElement.stillCrossAxis(Artboard.boxProps(artboard))).toEqual(
    Option.some("width"),
  );
});

test("揃えが start の Box でも、子の幅の始点が動かない", () => {
  expect(
    stillAxisOf({
      layout: "column",
      align: "start",
      widthMode: "fixed",
      width: 320,
    }),
  ).toEqual(Option.some("width"));
});

test("揃えが center の Box では、子の始点が動かない軸は無い", () => {
  expect(
    stillAxisOf({
      layout: "column",
      align: "center",
      widthMode: "fixed",
      width: 320,
    }),
  ).toEqual(Option.none);
});

test("揃えが end の Box では、子の始点が動かない軸は無い", () => {
  expect(
    stillAxisOf({
      layout: "column",
      align: "end",
      widthMode: "fixed",
      width: 320,
    }),
  ).toEqual(Option.none);
});

test("子を並べない Box では、子の始点が動かない軸は無い", () => {
  expect(
    stillAxisOf({
      layout: "free",
      widthMode: "fixed",
      width: 320,
      heightMode: "fixed",
      height: 200,
    }),
  ).toEqual(Option.none);
});

test("子を折り返す Box では、子の始点が動かない軸は無い", () => {
  expect(
    stillAxisOf({
      layout: "row",
      wrap: "wrap",
      heightMode: "fixed",
      height: 200,
    }),
  ).toEqual(Option.none);
});

test("交差軸が hug の Box では、子の始点が動かない軸は無い", () => {
  expect(stillAxisOf({ layout: "column", widthMode: "hug" })).toEqual(
    Option.none,
  );
});

test("交差軸が fill の Box では、子の始点が動かない軸は無い", () => {
  expect(stillAxisOf({ layout: "column", widthMode: "fill" })).toEqual(
    Option.none,
  );
});

test("交差軸が fixed なのに長さを書いていない Box では、子の始点が動かない軸は無い", () => {
  expect(stillAxisOf({ layout: "column", widthMode: "fixed" })).toEqual(
    Option.none,
  );
});

test("縦並びの Box の高さだけが固定でも、主軸の高さは答えない", () => {
  expect(
    stillAxisOf({ layout: "column", heightMode: "fixed", height: 200 }),
  ).toEqual(Option.none);
});

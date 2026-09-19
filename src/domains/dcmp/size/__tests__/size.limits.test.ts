import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Size } from "../index";

test("hug に最小を書くとその長さより縮まない", () => {
  expect(
    Size.declarations(
      Size.fromProps({ widthMode: "hug", minWidth: 120 }, "width"),
      "width",
      Option.some("row"),
    ),
  ).toEqual([
    { property: "width", value: "fit-content" },
    { property: "min-width", value: "120px" },
  ]);
});

test("hug に最大を書くとその長さより伸びない", () => {
  expect(
    Size.declarations(
      Size.fromProps({ widthMode: "hug", maxWidth: 400 }, "width"),
      "width",
      Option.some("row"),
    ),
  ).toEqual([
    { property: "width", value: "fit-content" },
    { property: "max-width", value: "400px" },
  ]);
});

test("fill に最小と最大の両方を書くと下限が先に出力される", () => {
  expect(
    Size.declarations(
      Size.fromProps(
        { widthMode: "fill", minWidth: 200, maxWidth: 400 },
        "width",
      ),
      "width",
      Option.some("row"),
    ),
  ).toEqual([
    { property: "flex-grow", value: "1" },
    { property: "min-width", value: "200px" },
    { property: "max-width", value: "400px" },
  ]);
});

test("fixed に最小を書いてもその宣言は出力しない", () => {
  expect(
    Size.declarations(
      Size.fromProps(
        { widthMode: "fixed", width: 320, minWidth: 120 },
        "width",
      ),
      "width",
      Option.some("row"),
    ),
  ).toEqual([{ property: "width", value: "320px" }]);
});

test("fixed に最大を書いてもその宣言は出力しない", () => {
  expect(
    Size.declarations(
      Size.fromProps(
        { widthMode: "fixed", width: 320, maxWidth: 400 },
        "width",
      ),
      "width",
      Option.some("row"),
    ),
  ).toEqual([{ property: "width", value: "320px" }]);
});

test("高さの軸の fixed に書いた最小も出力しない", () => {
  expect(
    Size.declarations(
      Size.fromProps(
        { heightMode: "fixed", height: 240, minHeight: 100 },
        "height",
      ),
      "height",
      Option.some("row"),
    ),
  ).toEqual([{ property: "height", value: "240px" }]);
});

test("並べる親を持たない位置の fill でも最小は出力する", () => {
  expect(
    Size.declarations(
      Size.fromProps({ widthMode: "fill", minWidth: 200 }, "width"),
      "width",
      Option.none,
    ),
  ).toEqual([{ property: "min-width", value: "200px" }]);
});

test("高さの軸では min-height と max-height を出力する", () => {
  expect(
    Size.declarations(
      Size.fromProps(
        { heightMode: "hug", minHeight: 80, maxHeight: 200 },
        "height",
      ),
      "height",
      Option.some("row"),
    ),
  ).toEqual([
    { property: "height", value: "fit-content" },
    { property: "min-height", value: "80px" },
    { property: "max-height", value: "200px" },
  ]);
});

test("数値でない最小は書かれていないものとして扱う", () => {
  expect(
    Size.declarations(
      Size.fromProps({ widthMode: "hug", minWidth: "abc" }, "width"),
      "width",
      Option.some("row"),
    ),
  ).toEqual([{ property: "width", value: "fit-content" }]);
});

test("幅の最小は minWidth prop が持ち、高さの最小と混ざらない", () => {
  expect(
    Size.declarations(
      Size.fromProps({ widthMode: "hug", minHeight: 80 }, "width"),
      "width",
      Option.some("row"),
    ),
  ).toEqual([{ property: "width", value: "fit-content" }]);
});

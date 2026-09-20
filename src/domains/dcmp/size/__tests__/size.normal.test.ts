import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Size } from "../index";

test("hug のサイズは内容に合わせて縮む", () => {
  expect(
    Size.declarations(
      Size.fromProps({ widthMode: "hug" }, "width"),
      "width",
      Option.some("row"),
    ),
  ).toEqual([{ property: "width", value: "fit-content" }]);
});

test("fixed のサイズは指定した px の長さになる", () => {
  expect(
    Size.declarations(
      Size.fromProps({ widthMode: "fixed", width: 320 }, "width"),
      "width",
      Option.some("row"),
    ),
  ).toEqual([{ property: "width", value: "320px" }]);
});

test("fixed 以外のモードでは長さの指定が無視される", () => {
  expect(Size.fromProps({ widthMode: "hug", width: 320 }, "width")).toEqual({
    mode: "hug",
    limits: { min: Option.none, max: Option.none },
  });
});

test("fixed なのに長さが無いときはサイズを決められない", () => {
  expect(Size.fromProps({ widthMode: "fixed" }, "width")).toBeUndefined();
});

test("サイズを決められないときは宣言を出力しない", () => {
  expect(Size.declarations(undefined, "width", Option.some("row"))).toEqual([]);
});

test("主軸方向に fill を指定すると伸長する", () => {
  expect(
    Size.declarations(
      Size.fromProps({ widthMode: "fill" }, "width"),
      "width",
      Option.some("row"),
    ),
  ).toEqual([{ property: "flex-grow", value: "1" }]);
});

test("交差軸方向に fill を指定すると引き伸ばされる", () => {
  expect(
    Size.declarations(
      Size.fromProps({ widthMode: "fill" }, "width"),
      "width",
      Option.some("column"),
    ),
  ).toEqual([{ property: "align-self", value: "stretch" }]);
});

test("並べる親を持たない位置の fill は宣言を出力しない", () => {
  expect(
    Size.declarations(
      Size.fromProps({ widthMode: "fill" }, "width"),
      "width",
      Option.none,
    ),
  ).toEqual([]);
});

test("並べる親を持たない位置でも fill 以外のサイズは宣言を出力する", () => {
  expect(
    Size.declarations(
      Size.fromProps({ heightMode: "fixed", height: 240 }, "height"),
      "height",
      Option.none,
    ),
  ).toEqual([{ property: "height", value: "240px" }]);
});

test("未知のモードはサイズを決められない", () => {
  expect(
    Size.fromProps({ widthMode: "unknown", width: 320 }, "width"),
  ).toBeUndefined();
});

test("幅の軸のモードは widthMode prop が持つ", () => {
  expect(Size.modeProp("width")).toBe("widthMode");
});

test("高さの軸のモードは heightMode prop が持つ", () => {
  expect(Size.modeProp("height")).toBe("heightMode");
});

test("fixed のサイズからは指定した長さを取り出せる", () => {
  expect(
    Size.fixedLength(
      Size.fromProps({ widthMode: "fixed", width: 320 }, "width"),
    ),
  ).toEqual(Option.some(320));
});

test("hug のサイズは固定の長さを持たない", () => {
  expect(
    Size.fixedLength(Size.fromProps({ widthMode: "hug" }, "width")),
  ).toEqual(Option.none);
});

test("サイズが決まらないときは固定の長さも持たない", () => {
  expect(Size.fixedLength(undefined)).toEqual(Option.none);
});

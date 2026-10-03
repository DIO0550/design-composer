import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Size } from "../index";

test("hug のサイズは内容に合わせて縮む", () => {
  expect(
    Size.declarationsFromProps(
      { widthMode: "hug" },
      "width",
      Option.some("row"),
    ),
  ).toEqual([{ property: "width", value: "fit-content" }]);
});

test("fixed のサイズは指定した px の長さになる", () => {
  expect(
    Size.declarationsFromProps(
      { widthMode: "fixed", width: 320 },
      "width",
      Option.some("row"),
    ),
  ).toEqual([{ property: "width", value: "320px" }]);
});

test("fixed 以外のモードでは長さの指定が無視される", () => {
  expect(Size.fromProps({ widthMode: "hug", width: 320 }, "width")).toEqual(
    Option.some({
      mode: "hug",
      limits: { min: Option.none, max: Option.none },
    }),
  );
});

test("fixed なのに長さが無いときはサイズを決められない", () => {
  expect(Size.fromProps({ widthMode: "fixed" }, "width")).toEqual(Option.none);
});

test("サイズを決められないときは宣言を出力しない", () => {
  expect(
    Size.declarationsFromProps(
      { widthMode: "fixed" },
      "width",
      Option.some("row"),
    ),
  ).toEqual([]);
});

test("主軸方向に fill を指定すると伸長する", () => {
  expect(
    Size.declarationsFromProps(
      { widthMode: "fill" },
      "width",
      Option.some("row"),
    ),
  ).toEqual([{ property: "flex-grow", value: "1" }]);
});

test("交差軸方向に fill を指定すると引き伸ばされる", () => {
  expect(
    Size.declarationsFromProps(
      { widthMode: "fill" },
      "width",
      Option.some("column"),
    ),
  ).toEqual([{ property: "align-self", value: "stretch" }]);
});

test("並べる親を持たない位置の fill は宣言を出力しない", () => {
  expect(
    Size.declarationsFromProps({ widthMode: "fill" }, "width", Option.none),
  ).toEqual([]);
});

test("並べる親を持たない位置でも fill 以外のサイズは宣言を出力する", () => {
  expect(
    Size.declarationsFromProps(
      { heightMode: "fixed", height: 240 },
      "height",
      Option.none,
    ),
  ).toEqual([{ property: "height", value: "240px" }]);
});

test("未知のモードはサイズを決められない", () => {
  expect(Size.fromProps({ widthMode: "unknown", width: 320 }, "width")).toEqual(
    Option.none,
  );
});

test("幅の軸のモードは widthMode prop が持つ", () => {
  expect(Size.modeProp("width")).toBe("widthMode");
});

test("高さの軸のモードは heightMode prop が持つ", () => {
  expect(Size.modeProp("height")).toBe("heightMode");
});

test("fixed のサイズからは指定した長さを取り出せる", () => {
  expect(
    Size.fixedLengthFromProps({ widthMode: "fixed", width: 320 }, "width"),
  ).toEqual(Option.some(320));
});

test("hug のサイズは固定の長さを持たない", () => {
  expect(Size.fixedLengthFromProps({ widthMode: "hug" }, "width")).toEqual(
    Option.none,
  );
});

test("サイズが決まらないときは固定の長さも持たない", () => {
  expect(Size.fixedLengthFromProps({ widthMode: "fixed" }, "width")).toEqual(
    Option.none,
  );
});

test("fill のサイズは固定の長さを持たない", () => {
  expect(Size.fixedLengthFromProps({ widthMode: "fill" }, "width")).toEqual(
    Option.none,
  );
});

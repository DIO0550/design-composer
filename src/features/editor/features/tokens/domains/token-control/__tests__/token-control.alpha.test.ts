import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { TokenControl } from "../index";
import { hexColorOf, rowsOf } from "./setup";

test("色の不透明度の欄には % で読んだ値が出る", () => {
  expect(hexColorOf("colors", "veil").alphaPercent).toBe(50.2);
});

test("不透明度に打った値は色の alpha になる", () => {
  const color = hexColorOf("colors", "primary");

  expect(TokenControl.valueFromAlpha(color.target, "50")).toEqual(
    Option.some({ kind: "colors", value: "#3b82f680" }),
  );
});

test("不透明度を 100 にすると色の alpha の桁が落ちる", () => {
  const color = hexColorOf("colors", "veil");

  expect(TokenControl.valueFromAlpha(color.target, "100")).toEqual(
    Option.some({ kind: "colors", value: "#3b82f6" }),
  );
});

test("色をピッカーで選び直しても不透明度は残る", () => {
  const color = hexColorOf("colors", "veil");

  expect(TokenControl.valueFrom(color.target, "#00ff00")).toEqual(
    Option.some({ kind: "colors", value: "#00ff0080" }),
  );
});

test.each([
  "-1",
  "101",
])("0–100 の外の不透明度 %s を打っても色を変えない", (raw) => {
  const color = hexColorOf("colors", "primary");

  expect(TokenControl.valueFromAlpha(color.target, raw)).toEqual(Option.none);
});

test("数値として読めない不透明度では色を変えない", () => {
  const color = hexColorOf("colors", "primary");

  expect(TokenControl.valueFromAlpha(color.target, "")).toEqual(Option.none);
});

test("影の色にも不透明度の欄が出る", () => {
  expect(hexColorOf("shadows", "sm").alphaPercent).toBe(10.2);
});

test("影の不透明度に打った値は影の色の alpha になる", () => {
  const color = hexColorOf("shadows", "sm");

  expect(TokenControl.valueFromAlpha(color.target, "50")).toEqual(
    Option.some({
      kind: "shadows",
      value: { x: 0, y: 1, blur: 3, color: "#00000080" },
    }),
  );
});

test("影の色をピッカーで選び直しても不透明度は残る", () => {
  const color = hexColorOf("shadows", "sm");

  expect(TokenControl.valueFrom(color.target, "#ff0000")).toEqual(
    Option.some({
      kind: "shadows",
      value: { x: 0, y: 1, blur: 3, color: "#ff00001a" },
    }),
  );
});

test("hex として読めない色は、見出し `値` で元の綴りのテキスト欄になる", () => {
  expect(rowsOf("colors", "broken")).toEqual([
    {
      kind: "color",
      color: {
        kind: "text",
        target: { kind: "colors", color: "RED" },
        caption: { name: "value", label: "値" },
        value: "RED",
      },
    },
  ]);
});

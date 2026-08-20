import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { TokenControl } from "../index";
import { fieldOf, fieldsOf } from "./setup";

test("色の不透明度の欄には % で読んだ値が出る", () => {
  expect(fieldOf("colors", "veil", "不透明度").input).toEqual({
    kind: "alphaPercent",
    value: 50.2,
  });
});

test("不透明度に打った値は色の alpha になる", () => {
  const field = fieldOf("colors", "primary", "不透明度");

  expect(TokenControl.valueFrom(field.target, "50")).toEqual(
    Option.some({ kind: "colors", value: "#3b82f680" }),
  );
});

test("不透明度を 100 にすると色の alpha の桁が落ちる", () => {
  const field = fieldOf("colors", "veil", "不透明度");

  expect(TokenControl.valueFrom(field.target, "100")).toEqual(
    Option.some({ kind: "colors", value: "#3b82f6" }),
  );
});

test("色をピッカーで選び直しても不透明度は残る", () => {
  const field = fieldOf("colors", "veil", "値");

  expect(TokenControl.valueFrom(field.target, "#00ff00")).toEqual(
    Option.some({ kind: "colors", value: "#00ff0080" }),
  );
});

test.each([
  "-1",
  "101",
])("0–100 の外の不透明度 %s を打っても色を変えない", (raw) => {
  const field = fieldOf("colors", "primary", "不透明度");

  expect(TokenControl.valueFrom(field.target, raw)).toEqual(Option.none);
});

test("数値として読めない不透明度では色を変えない", () => {
  const field = fieldOf("colors", "primary", "不透明度");

  expect(TokenControl.valueFrom(field.target, "")).toEqual(Option.none);
});

test("影の色にも不透明度の欄が出る", () => {
  expect(fieldOf("shadows", "sm", "不透明度").input).toEqual({
    kind: "alphaPercent",
    value: 10.2,
  });
});

test("影の不透明度に打った値は影の色の alpha になる", () => {
  const field = fieldOf("shadows", "sm", "不透明度");

  expect(TokenControl.valueFrom(field.target, "50")).toEqual(
    Option.some({
      kind: "shadows",
      value: { x: 0, y: 1, blur: 3, color: "#00000080" },
    }),
  );
});

test("影の色をピッカーで選び直しても不透明度は残る", () => {
  const field = fieldOf("shadows", "sm", "色");

  expect(TokenControl.valueFrom(field.target, "#ff0000")).toEqual(
    Option.some({
      kind: "shadows",
      value: { x: 0, y: 1, blur: 3, color: "#ff00001a" },
    }),
  );
});

test("hex として読めない色は打ち直せるテキスト欄1本になる", () => {
  expect(fieldsOf("colors", "broken")).toEqual([
    {
      name: "value",
      label: "値",
      input: { kind: "text", value: "RED" },
      target: { kind: "colors", color: "RED" },
    },
  ]);
});

test("不透明度の欄は色と影のそれぞれに1本ずつしか出ない", () => {
  const alphaRows = fieldsOf("shadows", "sm").filter(
    (field) => field.input.kind === "alphaPercent",
  );

  expect(alphaRows.map((field) => field.name)).toEqual(["colorAlpha"]);
});

import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { BoxSchema, PrimitiveSchema, TextSchema } from "../index";

test("Box の型名からは Box のスキーマが引ける", () => {
  expect(PrimitiveSchema.forTypeName("Box")).toEqual(Option.some(BoxSchema));
});

test("Text の型名からは Text のスキーマが引ける", () => {
  expect(PrimitiveSchema.forTypeName("Text")).toEqual(Option.some(TextSchema));
});

test("大文字小文字が違う型名からはスキーマが引けない", () => {
  expect(PrimitiveSchema.forTypeName("box")).toEqual(Option.none);
});

test("プリミティブに無い型名からはスキーマが引けない", () => {
  expect(PrimitiveSchema.forTypeName("Frame")).toEqual(Option.none);
});

test("Object.prototype 上の名前からはスキーマが引けない", () => {
  expect(PrimitiveSchema.forTypeName("constructor")).toEqual(Option.none);
});

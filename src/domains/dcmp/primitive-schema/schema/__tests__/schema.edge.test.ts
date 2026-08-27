import { expect, test } from "vitest";
import { PrimitiveSchema, PrimitiveTypes } from "../index";

test("プリミティブ語彙は Box と Text の2種類に閉じている", () => {
  expect(Object.values(PrimitiveTypes)).toEqual(["Box", "Text"]);
});

test("Box は子要素を持てる", () => {
  expect(PrimitiveSchema.allowsChildren("Box")).toBe(true);
});

test("Text は子要素を持てない", () => {
  expect(PrimitiveSchema.allowsChildren("Text")).toBe(false);
});

test("未知の type は子要素を持てないと判定される", () => {
  expect(PrimitiveSchema.allowsChildren("Unknown")).toBe(false);
});

import { expect, test } from "vitest";
import { PrimitiveSchema, PrimitiveTypes } from "../index";

test("プリミティブ語彙は Box・Text・Ellipse の3種類に閉じている", () => {
  expect(Object.values(PrimitiveTypes)).toEqual(["Box", "Text", "Ellipse"]);
});

test("Box は子要素を持てる", () => {
  expect(PrimitiveSchema.allowsChildren("Box")).toBe(true);
});

test("Text は子要素を持てない", () => {
  expect(PrimitiveSchema.allowsChildren("Text")).toBe(false);
});

test("Ellipse は子要素を持てない", () => {
  expect(PrimitiveSchema.allowsChildren("Ellipse")).toBe(false);
});

test("未知の type は子要素を持てないと判定される", () => {
  expect(PrimitiveSchema.allowsChildren("Unknown")).toBe(false);
});

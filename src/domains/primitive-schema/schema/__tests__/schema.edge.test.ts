import { expect, test } from "vitest";
import { allowsChildren, PRIMITIVE_TYPES } from "../index";

test("プリミティブ語彙は Box と Text の2種類に閉じている", () => {
  expect(PRIMITIVE_TYPES).toEqual(["Box", "Text"]);
});

test("Box は子要素を持てる", () => {
  expect(allowsChildren("Box")).toBe(true);
});

test("Text は子要素を持てない", () => {
  expect(allowsChildren("Text")).toBe(false);
});

test("未知の type は子要素を持てないと判定される", () => {
  expect(allowsChildren("Unknown")).toBe(false);
});

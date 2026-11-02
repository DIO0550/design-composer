import { expect, test } from "vitest";
import { ObjectEx } from "@/utils/ObjectEx";

test("null はオブジェクトと判定しない", () => {
  expect(ObjectEx.isObject(null)).toBe(false);
});

test("undefined はオブジェクトと判定しない", () => {
  expect(ObjectEx.isObject(undefined)).toBe(false);
});

test("文字列はオブジェクトと判定しない", () => {
  expect(ObjectEx.isObject("failed")).toBe(false);
});

test("数値はオブジェクトと判定しない", () => {
  expect(ObjectEx.isObject(0)).toBe(false);
});

test("関数はオブジェクトと判定しない", () => {
  expect(ObjectEx.isObject(() => "failed")).toBe(false);
});

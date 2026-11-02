import { expect, expectTypeOf, test } from "vitest";
import { ObjectEx } from "@/utils/ObjectEx";

test("オブジェクトはオブジェクトと判定する", () => {
  expect(ObjectEx.isObject({ message: "failed" })).toBe(true);
});

test("配列はオブジェクトと判定する", () => {
  expect(ObjectEx.isObject(["a"])).toBe(true);
});

test("オブジェクトと判定された側では、値をキーで引ける型に絞られる", () => {
  const value: unknown = JSON.parse('{"message": "failed"}');

  const message = ObjectEx.isObject(value) ? value.message : undefined;

  expectTypeOf(message).toEqualTypeOf<unknown>();
  expect(message).toBe("failed");
});

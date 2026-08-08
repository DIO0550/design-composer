import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ColorToken, Rgb } from "../index";

test.each([
  "#fff",
  "#12345",
  "3b82f6",
  "rgb(59, 130, 246)",
  "blue",
])("hex カラーでない値 %s は無効な色として判定される", (value) => {
  expect(ColorToken.isValid(value)).toBe(false);
});

test.each([
  "#fff",
  "#3b82f6ff",
  "3b82f6",
  "rgb(59, 130, 246)",
])("6桁の hex でない値 %s は RGB にできない", (value) => {
  expect(Rgb.create(value)).toEqual(Option.none);
});

test("大文字で書かれた6桁の hex は小文字の RGB になる", () => {
  expect(Rgb.create("#3B82F6")).toEqual(Option.some("#3b82f6"));
});

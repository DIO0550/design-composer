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

test.each([
  "#fff",
  "3b82f6",
  "rgb(59, 130, 246)",
  "blue",
])("hex として読めない値 %s からは6桁を取り出せない", (value) => {
  expect(ColorToken.rgbOf(value)).toEqual(Option.none);
});

test("alpha を持つ色からは alpha を除いた6桁が取り出せる", () => {
  expect(ColorToken.rgbOf("#3b82f680")).toEqual(Option.some("#3b82f6"));
});

test("hex として読めない色の不透明度は変えられない", () => {
  expect(ColorToken.withAlphaPercent("RED", 50)).toEqual(Option.none);
});

import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { TokenControl } from "../index";
import {
  gradientOf,
  gradientSelectionOf,
  selectedColorControl,
  selectedHexControl,
} from "./setup";

test("alpha を持つ色の hex の欄には、`#` を除いた 6 桁だけが出る", () => {
  expect(TokenControl.hexDigitsOf(selectedHexControl("colors", "veil"))).toBe(
    "3b82f6",
  );
});

test("影の色の hex の欄には、`#` を除いた 6 桁だけが出る", () => {
  expect(TokenControl.hexDigitsOf(selectedHexControl("shadows", "sm"))).toBe(
    "000000",
  );
});

test("色の hex に大文字で打った 6 桁は小文字で保存される", () => {
  const color = selectedHexControl("colors", "primary");

  expect(TokenControl.valueFromHex(color.target, "ABCDEF")).toEqual(
    Option.some({ kind: "colors", value: "#abcdef" }),
  );
});

test("色の hex に `#` 無しで打った 6 桁で色が変わり、不透明度は残る", () => {
  const color = selectedHexControl("colors", "veil");

  expect(TokenControl.valueFromHex(color.target, "00ff00")).toEqual(
    Option.some({ kind: "colors", value: "#00ff0080" }),
  );
});

test("影の色の hex に `#` 無しで打った 6 桁で影の色が変わり、不透明度は残る", () => {
  const color = selectedHexControl("shadows", "sm");

  expect(TokenControl.valueFromHex(color.target, "ff0000")).toEqual(
    Option.some({
      kind: "shadows",
      value: { x: 0, y: 1, blur: 3, color: "#ff00001a" },
    }),
  );
});

test("色の hex に `#` 付きで打った 6 桁でも色が変わる", () => {
  const color = selectedHexControl("colors", "primary");

  expect(TokenControl.valueFromHex(color.target, "#00ff00")).toEqual(
    Option.some({ kind: "colors", value: "#00ff00" }),
  );
});

test.each([
  "abc",
  "#ABC",
])("色の hex に打った 3 桁 %s は広げた 6 桁になり、不透明度は残る", (raw) => {
  const color = selectedHexControl("colors", "veil");

  expect(TokenControl.valueFromHex(color.target, raw)).toEqual(
    Option.some({ kind: "colors", value: "#aabbcc80" }),
  );
});

test.each([
  "abcf",
  "#abcf",
  "aabbccff",
  "#aabbccff",
  "abcd",
])("色の hex に打った 4 桁・8 桁 %s は alpha が不透明でも色を変えない", (raw) => {
  const color = selectedHexControl("colors", "primary");

  expect(TokenControl.valueFromHex(color.target, raw)).toEqual(Option.none);
});

test.each(["", "#", "##abc"])("色の hex に打った %j は色を変えない", (raw) => {
  const color = selectedHexControl("colors", "primary");

  expect(TokenControl.valueFromHex(color.target, raw)).toEqual(Option.none);
});

test("読めない色のテキスト欄に `#` 無しの 3 桁を打っても色を変えない", () => {
  const color = selectedColorControl("colors", "broken");

  expect(TokenControl.valueFrom(color.target, "abc")).toEqual(Option.none);
});

test("読めない色のテキスト欄に `#` 付きの 3 桁を打つと広げた 6 桁の色になる", () => {
  const color = selectedColorControl("colors", "broken");

  expect(TokenControl.valueFrom(color.target, "#abc")).toEqual(
    Option.some({ kind: "colors", value: "#aabbcc" }),
  );
});

test("読めない色の stop のテキスト欄に `#` 無しの 6 桁を打っても色を変えない", () => {
  const [stop] = gradientOf(
    gradientSelectionOf({
      stops: [
        { color: "RED", ratio: 0 },
        { color: "#ffffff", ratio: 1 },
      ],
    }),
  ).stops;

  expect(TokenControl.valueFrom(stop.color.target, "ff0000")).toEqual(
    Option.none,
  );
});

test("影の色のピッカーから `#` 無しの 6 桁が届いても色を変えない", () => {
  const color = selectedHexControl("shadows", "sm");

  expect(TokenControl.valueFrom(color.target, "ff0000")).toEqual(Option.none);
});

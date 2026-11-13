import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { TokenControl } from "../index";
import { fieldOf } from "./setup";

test("alpha を持つ色の hex の欄には 6 桁だけが出る", () => {
  expect(fieldOf("colors", "veil", "hex").input).toEqual({
    kind: "text",
    value: "#3b82f6",
  });
});

test("色の hex に大文字で打った 6 桁は小文字で保存される", () => {
  const field = fieldOf("colors", "primary", "hex");

  expect(TokenControl.valueFrom(field.target, "#ABCDEF")).toEqual(
    Option.some({ kind: "colors", value: "#abcdef" }),
  );
});

test("色の hex に打った 6 桁で色が変わり、不透明度は残る", () => {
  const field = fieldOf("colors", "veil", "hex");

  expect(TokenControl.valueFrom(field.target, "#00ff00")).toEqual(
    Option.some({ kind: "colors", value: "#00ff0080" }),
  );
});

test("影の色の hex の欄には 6 桁だけが出る", () => {
  expect(fieldOf("shadows", "sm", "hex").input).toEqual({
    kind: "text",
    value: "#000000",
  });
});

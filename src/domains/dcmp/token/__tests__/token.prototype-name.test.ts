import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { TokenSet } from "../index";

test("colors に無い constructor という名前の色は、同名扱いされずに追加できる", () => {
  const tokens = Result.unwrap(
    TokenSet.add(TokenSet.empty(), {
      kind: "colors",
      name: "constructor",
      value: "#000000",
    }),
  );

  expect(TokenSet.findColor(tokens, "constructor")).toEqual(
    Option.some("#000000"),
  );
});

test("トークンが1つも無ければ、Object.prototype 上の名前 toString のトークンは無い", () => {
  expect(TokenSet.has(TokenSet.empty(), "colors", "toString")).toBe(false);
});

test("トークンが1つも無ければ、constructor という名前の色は引けない", () => {
  expect(TokenSet.findColor(TokenSet.empty(), "constructor")).toEqual(
    Option.none,
  );
});

test("トークンが1つも無ければ、constructor という名前の数値のトークンは引けない", () => {
  expect(
    TokenSet.findNumber(TokenSet.empty(), "spacing", "constructor"),
  ).toEqual(Option.none);
});

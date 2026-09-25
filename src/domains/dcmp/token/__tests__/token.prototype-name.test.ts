import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { TokenSet } from "../index";

test("空のトークン一式に、constructor という色は無い", () => {
  expect(TokenSet.has(TokenSet.empty(), "colors", "constructor")).toBe(false);
});

test("constructor という名前の色を、空のトークン一式に足せる", () => {
  const added = TokenSet.add(TokenSet.empty(), {
    kind: "colors",
    name: "constructor",
    value: "#112233",
  });

  expect(Result.isOk(added)).toBe(true);
});

test("定義していない constructor という色を引くと、見つからない", () => {
  expect(TokenSet.findColor(TokenSet.empty(), "constructor")).toEqual(
    Option.none,
  );
});

test("定義していない toString という余白を引くと、見つからない", () => {
  expect(TokenSet.findNumber(TokenSet.empty(), "spacing", "toString")).toEqual(
    Option.none,
  );
});

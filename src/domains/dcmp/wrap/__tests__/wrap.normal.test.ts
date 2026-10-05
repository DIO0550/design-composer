import { expect, test } from "vitest";
import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import { Wrap } from "../index";

test("折り返しを書いていない Box は折り返さないものとして読まれる", () => {
  expect(Wrap.fromProps({})).toBe("nowrap");
});

test("折り返すと書いた Box は折り返すものとして読まれる", () => {
  expect(Wrap.fromProps({ wrap: "wrap" })).toBe("wrap");
});

test("語彙に無い綴りは折り返さないものとして読まれる", () => {
  expect(Wrap.fromProps({ wrap: "wrap-reverse" })).toBe("nowrap");
});

test("折り返す値は子を折り返す", () => {
  expect(Wrap.isWrapping("wrap")).toBe(true);
});

test("折り返さない値は子を折り返さない", () => {
  expect(Wrap.isWrapping("nowrap")).toBe(false);
});

test("折り返す Box は flex-wrap の宣言 1 件になる", () => {
  expect(Wrap.declarations("wrap")).toEqual([
    CssDeclaration.create("flex-wrap", "wrap"),
  ]);
});

test("折り返さない Box は宣言を出さない", () => {
  expect(Wrap.declarations("nowrap")).toEqual([]);
});

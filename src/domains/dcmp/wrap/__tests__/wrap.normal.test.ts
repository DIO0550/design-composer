import { expect, test } from "vitest";
import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import { Wrap } from "../index";

test("折り返しを書いていない Box は折り返さない", () => {
  expect(Wrap.fromProps({})).toBe("nowrap");
});

test("props に書かれた折り返しをそのまま読む", () => {
  expect(Wrap.fromProps({ wrap: "wrap" })).toBe("wrap");
});

test("折り返す指定は flex-wrap の 1 件になる", () => {
  expect(Wrap.declarations("wrap")).toEqual([
    CssDeclaration.create("flex-wrap", "wrap"),
  ]);
});

test("折り返さない指定は宣言を出さない", () => {
  expect(Wrap.declarations("nowrap")).toEqual([]);
});

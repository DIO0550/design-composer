import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { AppStateJson } from "../index";

test("JSON として読めないテキストは読み取れない", () => {
  expect(Result.isOk(AppStateJson.parse("{"))).toBe(false);
});

test("オブジェクトではない JSON は読み取れない", () => {
  expect(Result.isOk(AppStateJson.parse('["/work/login.dcmp"]'))).toBe(false);
});

test("recentPaths を持たないオブジェクトは読み取れない", () => {
  expect(Result.isOk(AppStateJson.parse('{"windowSize":{"width":800}}'))).toBe(
    false,
  );
});

test("recentPaths に文字列以外が混ざっていたら読み取れない", () => {
  expect(
    Result.isOk(AppStateJson.parse('{"recentPaths":["/work/login.dcmp",42]}')),
  ).toBe(false);
});

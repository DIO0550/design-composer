import { expect, test } from "vitest";
import { Wrap } from "../index";

test("語彙に無い綴りの折り返しは折り返さないとして読まれる", () => {
  expect(Wrap.fromProps({ wrap: "wrap-reverse" })).toBe("nowrap");
});

test("文字列でない値の折り返しは折り返さないとして読まれる", () => {
  expect(Wrap.fromProps({ wrap: true })).toBe("nowrap");
});

import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { NameFilter } from "../index";

test("空の語からは絞り込みが作られない", () => {
  expect(NameFilter.create("")).toEqual(Option.none);
});

test("1 文字でもあれば絞り込みが作られる", () => {
  expect(NameFilter.create("a").some).toBe(true);
});

test("名前の途中に語を含んでいれば一致する", () => {
  const filter = Option.unwrap(NameFilter.create("form"));

  expect(NameFilter.isMatch(filter, "login-form-title")).toBe(true);
});

test("大文字小文字が違っていても一致する", () => {
  const filter = Option.unwrap(NameFilter.create("FORM"));

  expect(NameFilter.isMatch(filter, "login-form")).toBe(true);
});

test("語を含まない名前には一致しない", () => {
  const filter = Option.unwrap(NameFilter.create("form"));

  expect(NameFilter.isMatch(filter, "header")).toBe(false);
});

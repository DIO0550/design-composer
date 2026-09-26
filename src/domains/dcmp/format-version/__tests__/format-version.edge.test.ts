import { expect, test } from "vitest";
import { FormatVersion } from "../index";

test.each([
  "1",
  "1.a",
  "abc",
  "",
  "1.2.3",
])("major.minor 形式でない文字列 %s をパースすると値を持たない", (value) => {
  expect(FormatVersion.parse(value)).toEqual({ some: false });
});

test.each([
  "01.2",
  "1.02",
  "00.1",
])("0 以外の数の先頭に 0 がある綴り %s は読めない", (value) => {
  expect(FormatVersion.parse(value)).toEqual({ some: false });
});

test.each([
  "9007199254740992.0",
  "1.9007199254740992",
])("Number で正確に表せない大きな数を含む綴り %s は読めない", (value) => {
  expect(FormatVersion.parse(value)).toEqual({ some: false });
});

test.each([
  {
    value: "9007199254740991.0",
    expected: { major: Number.MAX_SAFE_INTEGER, minor: 0 },
  },
  {
    value: "1.9007199254740991",
    expected: { major: 1, minor: Number.MAX_SAFE_INTEGER },
  },
])("Number で正確に表せる最大の数を含む綴り $value は読める", ({
  value,
  expected,
}) => {
  expect(FormatVersion.parse(value)).toEqual({ some: true, value: expected });
});

test.each([
  { value: "0.9", expected: { major: 0, minor: 9 } },
  { value: "1.0", expected: { major: 1, minor: 0 } },
])("0 そのものは先頭の 0 ではないので $value は読める", ({
  value,
  expected,
}) => {
  expect(FormatVersion.parse(value)).toEqual({ some: true, value: expected });
});

test("ファイルの major がアプリより大きいとき unsupported になる", () => {
  expect(
    FormatVersion.compatibility({ major: 2, minor: 0 }, { major: 1, minor: 0 }),
  ).toBe("unsupported");
});

test("ファイルの major がアプリより小さいとき needs-migration になる", () => {
  expect(
    FormatVersion.compatibility({ major: 1, minor: 0 }, { major: 2, minor: 0 }),
  ).toBe("needs-migration");
});

test("major が一致し minor がアプリより大きいとき unsupported になる", () => {
  expect(
    FormatVersion.compatibility({ major: 1, minor: 5 }, { major: 1, minor: 0 }),
  ).toBe("unsupported");
});

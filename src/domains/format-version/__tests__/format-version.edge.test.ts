import { expect, test } from "vitest";
import { FormatVersion } from "../index";

test.each([
  "1",
  "1.a",
  "abc",
  "",
  "1.2.3",
])("major.minor 形式でない文字列 %s をパースするとエラーになる", (value) => {
  expect(() => FormatVersion.parse(value)).toThrow();
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

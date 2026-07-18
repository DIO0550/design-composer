import { expect, test } from "vitest";
import { FormatVersion } from "../index";

test("major.minor 形式の文字列をパースするとその値を持つ FormatVersion になる", () => {
  expect(FormatVersion.parse("1.2")).toEqual({ major: 1, minor: 2 });
});

test("FormatVersion を文字列にフォーマットすると major.minor 形式になる", () => {
  expect(FormatVersion.format({ major: 1, minor: 2 })).toBe("1.2");
});

test.each([
  { fileVersion: { major: 1, minor: 0 }, appVersion: { major: 1, minor: 0 } },
  { fileVersion: { major: 1, minor: 0 }, appVersion: { major: 1, minor: 3 } },
])("ファイルの major がアプリと一致し minor がアプリ以下のとき compatible になる ($fileVersion.minor <= $appVersion.minor)", ({
  fileVersion,
  appVersion,
}) => {
  expect(FormatVersion.compatibility(fileVersion, appVersion)).toBe(
    "compatible",
  );
});

test("appVersion を省略すると現在の FormatVersion と比較される", () => {
  expect(FormatVersion.compatibility(FormatVersion.CURRENT)).toBe("compatible");
});

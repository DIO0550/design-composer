import { expect, test } from "vitest";
import { filePath } from "@/domains/__tests__/file-paths";
import { Option } from "@/utils/Option";
import { FilePath } from "../index";

test("区切りを含まないパスには親フォルダの名前が無い", () => {
  expect(FilePath.folderName(filePath("app.dcmp"))).toStrictEqual(Option.none);
});

test("ルート直下のファイルには親フォルダの名前が無い", () => {
  expect(FilePath.folderName(filePath("/app.dcmp"))).toStrictEqual(Option.none);
});

test("区切りが連続していても親フォルダの名前が取れる", () => {
  expect(FilePath.folderName(filePath("/work//app.dcmp"))).toStrictEqual(
    Option.some("work"),
  );
});

test("Windows のドライブ直下ではドライブ名が親フォルダの名前になる", () => {
  expect(FilePath.folderName(filePath("C:\\app.dcmp"))).toStrictEqual(
    Option.some("C:"),
  );
});

test.each([
  "",
  "/",
  "\\",
  "//",
])("ファイル名の要素を持たない文字列（%j）はファイルのパスにならない", (raw) => {
  expect(FilePath.create(raw)).toStrictEqual(Option.none);
});

test("区切りで終わっても空でない要素があればファイルのパスになり、その要素がファイル名になる", () => {
  expect(FilePath.fileName(filePath("/work/app/"))).toBe("app");
});

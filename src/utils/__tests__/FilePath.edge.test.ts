import { expect, test } from "vitest";
import { FilePath } from "@/utils/FilePath";
import { Option } from "@/utils/Option";

test("区切りを含まないパスには親フォルダの名前が無い", () => {
  expect(FilePath.folderName("app.dcmp")).toStrictEqual(Option.none);
});

test("ルート直下のファイルには親フォルダの名前が無い", () => {
  expect(FilePath.folderName("/app.dcmp")).toStrictEqual(Option.none);
});

test("区切りが連続していても親フォルダの名前が取れる", () => {
  expect(FilePath.folderName("/work//app.dcmp")).toStrictEqual(
    Option.some("work"),
  );
});

test("Windows のドライブ直下ではドライブ名が親フォルダの名前になる", () => {
  expect(FilePath.folderName("C:\\app.dcmp")).toStrictEqual(Option.some("C:"));
});

test("要素を 1 つも持たないパスにはファイルの名前が無い", () => {
  expect(FilePath.fileName("/")).toStrictEqual(Option.none);
});

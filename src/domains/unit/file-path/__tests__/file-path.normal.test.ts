import { expect, test } from "vitest";
import { filePath } from "@/domains/__tests__/file-paths";
import { Option } from "@/utils/Option";
import { FilePath } from "../index";

test("ファイルの名前はパスの末尾になる", () => {
  expect(FilePath.fileName(filePath("/work/settings-ui/app.dcmp"))).toBe(
    "app.dcmp",
  );
});

test("親フォルダの名前はパスの末尾から 2 番目になる", () => {
  expect(
    FilePath.folderName(filePath("/work/settings-ui/app.dcmp")),
  ).toStrictEqual(Option.some("settings-ui"));
});

test("Windows の区切りでもファイルの名前が取れる", () => {
  expect(FilePath.fileName(filePath("C:\\work\\settings-ui\\app.dcmp"))).toBe(
    "app.dcmp",
  );
});

test("Windows の区切りでも親フォルダの名前が取れる", () => {
  expect(
    FilePath.folderName(filePath("C:\\work\\settings-ui\\app.dcmp")),
  ).toStrictEqual(Option.some("settings-ui"));
});

test("ファイル名の要素を持つ文字列は、綴りを変えずにファイルのパスになる", () => {
  expect(FilePath.create("/work//settings-ui/./app.dcmp")).toStrictEqual(
    Option.some("/work//settings-ui/./app.dcmp"),
  );
});

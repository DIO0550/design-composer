import { expect, test } from "vitest";
import { FilePath } from "@/utils/FilePath";
import { Option } from "@/utils/Option";

test("ファイルの名前はパスの末尾になる", () => {
  expect(FilePath.fileName("/work/settings-ui/app.dcmp")).toStrictEqual(
    Option.some("app.dcmp"),
  );
});

test("親フォルダの名前はパスの末尾から 2 番目になる", () => {
  expect(FilePath.folderName("/work/settings-ui/app.dcmp")).toStrictEqual(
    Option.some("settings-ui"),
  );
});

test("Windows の区切りでもファイルの名前が取れる", () => {
  expect(FilePath.fileName("C:\\work\\settings-ui\\app.dcmp")).toStrictEqual(
    Option.some("app.dcmp"),
  );
});

test("Windows の区切りでも親フォルダの名前が取れる", () => {
  expect(FilePath.folderName("C:\\work\\settings-ui\\app.dcmp")).toStrictEqual(
    Option.some("settings-ui"),
  );
});

import { expect, test } from "vitest";
import { openedAt } from "@/domains/__tests__/sample-document";
import { Option } from "@/utils/Option";
import { OpenedDocument } from "../index";

test("開いているファイルの名前はパスの末尾になる", () => {
  expect(
    OpenedDocument.fileName(openedAt("/work/settings-ui/app.dcmp")),
  ).toStrictEqual(Option.some("app.dcmp"));
});

test("親フォルダの名前はパスの末尾から 2 番目になる", () => {
  expect(
    OpenedDocument.folderName(openedAt("/work/settings-ui/app.dcmp")),
  ).toStrictEqual(Option.some("settings-ui"));
});

test("区切りを含まないパスには親フォルダの名前が無い", () => {
  expect(OpenedDocument.folderName(openedAt("app.dcmp"))).toStrictEqual(
    Option.none,
  );
});

test("ルート直下のファイルには親フォルダの名前が無い", () => {
  expect(OpenedDocument.folderName(openedAt("/app.dcmp"))).toStrictEqual(
    Option.none,
  );
});

test("区切りが連続していても親フォルダの名前が取れる", () => {
  expect(OpenedDocument.folderName(openedAt("/work//app.dcmp"))).toStrictEqual(
    Option.some("work"),
  );
});

test("Windows の区切りでもファイルの名前が取れる", () => {
  expect(
    OpenedDocument.fileName(openedAt("C:\\work\\settings-ui\\app.dcmp")),
  ).toStrictEqual(Option.some("app.dcmp"));
});

test("Windows のドライブ直下ではドライブ名が親フォルダの名前になる", () => {
  expect(OpenedDocument.folderName(openedAt("C:\\app.dcmp"))).toStrictEqual(
    Option.some("C:"),
  );
});

test("Windows の区切りでも親フォルダの名前が取れる", () => {
  expect(
    OpenedDocument.folderName(openedAt("C:\\work\\settings-ui\\app.dcmp")),
  ).toStrictEqual(Option.some("settings-ui"));
});

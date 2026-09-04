import { expect, test } from "vitest";
import { openedAt } from "@/domains/__tests__/sample-document";
import { Option } from "@/utils/Option";
import { OpenedDocument } from "../index";

/*
 * パスの割り方そのものの観点（区切りの連続・Windows の区切り・ドライブ直下・空）は
 * `src/utils/__tests__/FilePath.*.test.ts` にある。ここで見るのは、開いている
 * ドキュメントが自分の保存先の名前を答えられることだけ。
 */

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

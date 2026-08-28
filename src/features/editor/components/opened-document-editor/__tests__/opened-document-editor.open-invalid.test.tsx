import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import {
  SampleDocumentWithDanglingToken,
  SampleDocumentWithMissingComponent,
} from "@/features/editor/__tests__/sample-document";
import {
  documentErrorList,
  renderOpenedDocument,
  selectInTree,
  tree,
} from "./setup";

/*
 * 開いた時点で既に不正なドキュメント（#158）。自動保存が書き出した不正なファイルを
 * 開き直すとこの状態になる。
 *
 * `opened-document-editor.edit-error.test.tsx` は 7 本とも「妥当なドキュメントを開いて
 * から編集で不正を作る」経路で、開いた直後から不正がある状態はどこも通っていない。
 * ここで確かめるのは器の重複ではなく、**その状態で編集を続けて直せる**こと。
 */

test("開いた時点で不正があるドキュメントは、凍結されずにその不正が一覧へ出る", async () => {
  await renderOpenedDocument(SampleDocumentWithDanglingToken);

  expect(
    within(documentErrorList()).getByText("home-title.typography"),
  ).toBeDefined();
});

test("開いた時点であった不正は、そのノードを消すと一覧から消える", async () => {
  await renderOpenedDocument(SampleDocumentWithDanglingToken);
  await selectInTree("home-title");

  await userEvent.keyboard("{Delete}");

  expect(
    screen.queryByRole("alert", { name: "ドキュメントのエラー一覧" }),
  ).toBeNull();
});

/*
 * 部品の dangling 参照は `DocumentHtml.compile` が失敗するのでキャンバスが 1 枚も
 * 描けない（その表示自体は `artboard-canvas.normal` が見ている）。それでもツリーは
 * `selection.document` を読んでいるので直せる、が「不正でも開く」を成り立たせている
 * 前提（docs/03-schema.md「不正ファイル時の挙動」の「開く時」）。
 */
test("キャンバスをコンパイルできないドキュメントでも、ツリーからそのノードを消せる", async () => {
  await renderOpenedDocument(SampleDocumentWithMissingComponent);
  await selectInTree("home-login");

  await userEvent.keyboard("{Delete}");

  expect(rowNames(tree())).toEqual(["home-title"]);
});

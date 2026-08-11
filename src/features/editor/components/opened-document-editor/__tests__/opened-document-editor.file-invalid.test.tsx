import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { SAMPLE_DOCUMENT } from "@/features/editor/__tests__/sample-document";
import { DocumentJson } from "@/libs/document-json";
import { Option } from "@/utils/Option";
import {
  fileErrorList,
  invalidateFileExternally,
  PATH,
  propertyPane,
  renderOpenedDocument,
  selectInTree,
} from "./setup";

/** 見出しの右端にある書き戻しのボタン。 */
function revertButton(): HTMLElement {
  return within(fileErrorList()).getByRole("button", { name: "revert file" });
}

test("不正になったファイルのエラー行から、そのノードをプロパティパネルに出せる", async () => {
  const fake = await renderOpenedDocument();
  // 別のノードを選択済みから始める（未選択だと既定の見え方と紛れる）
  await selectInTree("home-login");
  await invalidateFileExternally(fake);

  await userEvent.click(
    within(fileErrorList()).getByRole("button", { name: "home-title を表示" }),
  );

  expect(within(propertyPane()).getByText("home-title")).toBeDefined();
});

test("書き戻すと、表示中の内容がファイルへ書かれてエラー一覧が消える", async () => {
  const fake = await renderOpenedDocument();
  await invalidateFileExternally(fake);

  await userEvent.click(revertButton());
  await act(async () => {});

  expect(Option.unwrap(fake.contentOf(PATH))).toBe(
    DocumentJson.serialize(SAMPLE_DOCUMENT),
  );
  expect(screen.queryByRole("alert", { name: "エラー一覧" })).toBeNull();
});

test("書き込みが終わるまでは、書き戻しを押し直せない", async () => {
  const fake = await renderOpenedDocument();
  await invalidateFileExternally(fake);
  const releaseWrite = fake.holdWrites(PATH);

  await userEvent.click(revertButton());

  expect(revertButton().hasAttribute("disabled")).toBe(true);

  releaseWrite();
  await act(async () => {});
});

test("書き戻しに失敗すると、エラー一覧は残ったまま失敗が伝わる", async () => {
  const fake = await renderOpenedDocument();
  await invalidateFileExternally(fake);
  fake.denyWrites(PATH);

  await userEvent.click(revertButton());
  await act(async () => {});

  expect(screen.getByText("ファイルへの書き戻しに失敗しました")).toBeDefined();
  expect(fileErrorList()).toBeDefined();
});

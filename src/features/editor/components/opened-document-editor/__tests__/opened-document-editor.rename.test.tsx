import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import { SampleDocumentWithDeepBranch } from "@/features/editor/__tests__/sample-document";
import { hasNoNameField, nameField } from "@/features/sidebar/__tests__";
import {
  artboardList,
  drawn,
  renderOpenedDocument,
  selectArtboard,
  selectInTree,
  tree,
} from "./setup";

/*
 * 名前の変更を、3 つの入口（ツリーの行のダブルクリック・コンテキストメニュー・⌘R）から
 * 通しで確かめる（docs/06-ui.md「名前の変更」）。
 *
 * 使える名前かどうかは `DesignDocument.rename` のテストが、行の振る舞いは
 * `document-tree.rename` が固定するので、ここで見るのは入口から結果までの配線。
 */

test("ツリーの行をダブルクリックすると名前の入力欄になる", async () => {
  await renderOpenedDocument();

  await userEvent.dblClick(
    within(tree()).getByRole("button", { name: "home-title" }),
  );

  expect(nameField().value).toBe("home-title");
});

test("ツリーの行を打ち替えて Enter を押すと、その名前で並ぶ", async () => {
  await renderOpenedDocument();

  await userEvent.dblClick(
    within(tree()).getByRole("button", { name: "home-title" }),
  );
  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "home-caption{Enter}");

  expect(rowNames(tree())).toEqual(["home-caption", "home-login"]);
});

test("コンテキストメニューの Rename からも入力欄が開く", async () => {
  await renderOpenedDocument();

  fireEvent.contextMenu(drawn("home-title"), { clientX: 120, clientY: 80 });
  await userEvent.click(
    within(
      screen.getByRole("menu", { name: "コンテキストメニュー" }),
    ).getByRole("menuitem", { name: /^Rename/ }),
  );

  expect(nameField().value).toBe("home-title");
});

test("⌘R を押すと、選んでいるものの名前の入力欄が開く", async () => {
  await renderOpenedDocument();

  await selectInTree("home-title");
  await userEvent.keyboard("{Meta>}r{/Meta}");

  expect(nameField().value).toBe("home-title");
});

test("何も選んでいないときに ⌘R を押しても入力欄は開かない", async () => {
  await renderOpenedDocument();

  await userEvent.keyboard("{Meta>}r{/Meta}");

  expect(hasNoNameField()).toBe(true);
});

test("既に使われている名前を打って Enter を押しても、名前は変わらない", async () => {
  await renderOpenedDocument();

  await userEvent.dblClick(
    within(tree()).getByRole("button", { name: "home-title" }),
  );
  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "home-login{Enter}");

  // 編集中の行はツリーで入力欄になっているので、名前が残っているかはキャンバスで見る
  expect(drawn("home-title")).toBeDefined();
});

test("既に使われている名前を打って Enter を押しても、入力欄は閉じない", async () => {
  await renderOpenedDocument();

  await userEvent.dblClick(
    within(tree()).getByRole("button", { name: "home-title" }),
  );
  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "home-login{Enter}");

  expect(nameField().value).toBe("home-login");
});

test("Escape を押すと名前は変わらず入力欄が閉じる", async () => {
  await renderOpenedDocument();

  await userEvent.dblClick(
    within(tree()).getByRole("button", { name: "home-title" }),
  );
  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "home-caption{Escape}");

  expect(rowNames(tree())).toEqual(["home-title", "home-login"]);
  expect(hasNoNameField()).toBe(true);
});

test("artboard の行からも名前を変えられる", async () => {
  await renderOpenedDocument();

  await selectArtboard("home");
  await userEvent.dblClick(
    within(artboardList()).getByRole("button", { name: "home" }),
  );
  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "top{Enter}");

  expect(
    within(artboardList()).getByRole("button", { name: "top" }),
  ).toBeDefined();
});

test("名前を変えたあと ⌘Z で戻せる", async () => {
  await renderOpenedDocument();

  await userEvent.dblClick(
    within(tree()).getByRole("button", { name: "home-title" }),
  );
  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "home-caption{Enter}");
  await userEvent.keyboard("{Meta>}z{/Meta}");

  expect(rowNames(tree())).toEqual(["home-title", "home-login"]);
});

test("打ち替えてフォーカスを外すと、その名前で並ぶ", async () => {
  await renderOpenedDocument();

  await userEvent.dblClick(
    within(tree()).getByRole("button", { name: "home-title" }),
  );
  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "home-caption");
  await userEvent.click(
    within(tree()).getByRole("button", { name: "home-login" }),
  );

  expect(rowNames(tree())).toEqual(["home-caption", "home-login"]);
});

test("入れ子の行からも名前を変えられる", async () => {
  await renderOpenedDocument(SampleDocumentWithDeepBranch);

  await selectInTree("deep-title");
  await userEvent.dblClick(
    within(tree()).getByRole("button", { name: "deep-title" }),
  );
  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "deep-caption{Enter}");

  expect(
    within(tree()).getByRole("button", { name: "deep-caption" }),
  ).toBeDefined();
});

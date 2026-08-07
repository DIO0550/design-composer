import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { treeRowNames } from "@/features/editor/__tests__/tree-rows";
import { renderOpenedDocument } from "./setup";

function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

/** 並べ替え前の home の子の並び。 */
const ORIGINAL_CHILDREN = ["home-title", "home-login"];

/** 並べ替え後の home の子の並び。 */
const REORDERED_CHILDREN = ["home-login", "home-title"];

test("並べ替えたあとに Ctrl+Z を押すと並びが元に戻る", async () => {
  await renderOpenedDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "home-title を下へ" }),
  );

  await userEvent.keyboard("{Control>}z{/Control}");

  expect(treeRowNames(tree()).slice(1, 3)).toEqual(ORIGINAL_CHILDREN);
});

test("戻したあとに Ctrl+Shift+Z を押すと並べ替えが再び反映される", async () => {
  await renderOpenedDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "home-title を下へ" }),
  );
  await userEvent.keyboard("{Control>}z{/Control}");

  await userEvent.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");

  expect(treeRowNames(tree()).slice(1, 3)).toEqual(REORDERED_CHILDREN);
});

test("何も編集していないときに Ctrl+Z を押しても画面は変わらない", async () => {
  await renderOpenedDocument();

  await userEvent.keyboard("{Control>}z{/Control}");

  expect(treeRowNames(tree()).slice(1, 3)).toEqual(ORIGINAL_CHILDREN);
});

test("削除を戻すと消したノードがツリーに返ってくる", async () => {
  await renderOpenedDocument();
  await userEvent.click(screen.getByRole("button", { name: "home-title" }));
  await userEvent.click(screen.getByRole("button", { name: "削除" }));

  await userEvent.keyboard("{Control>}z{/Control}");

  expect(treeRowNames(tree()).slice(1, 3)).toEqual(ORIGINAL_CHILDREN);
});

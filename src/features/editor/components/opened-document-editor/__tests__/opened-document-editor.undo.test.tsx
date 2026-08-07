import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { treeRowNames } from "@/features/editor/__tests__/tree-rows";
import { renderOpenedDocument } from "./setup";

function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

test("並べ替えたあとに Ctrl+Z を押すと並べ替える前の順序に戻る", async () => {
  await renderOpenedDocument();
  const before = treeRowNames(tree());
  await userEvent.click(
    screen.getByRole("button", { name: "home-title を下へ" }),
  );

  await userEvent.keyboard("{Control>}z{/Control}");

  expect(treeRowNames(tree())).toEqual(before);
});

test("戻したあとに Ctrl+Shift+Z を押すと並べ替えたあとの順序に戻る", async () => {
  await renderOpenedDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "home-title を下へ" }),
  );
  const reordered = treeRowNames(tree());
  await userEvent.keyboard("{Control>}z{/Control}");

  await userEvent.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");

  expect(treeRowNames(tree())).toEqual(reordered);
});

test("削除したあとに Ctrl+Z を押すと消したノードが戻る", async () => {
  await renderOpenedDocument();
  const before = treeRowNames(tree());
  await userEvent.click(screen.getByRole("button", { name: "home-title" }));
  await userEvent.keyboard("{Delete}");

  await userEvent.keyboard("{Control>}z{/Control}");

  expect(treeRowNames(tree())).toEqual(before);
});

test("編集していないときに Ctrl+Z を押してもツリーは変わらない", async () => {
  await renderOpenedDocument();
  const before = treeRowNames(tree());

  await userEvent.keyboard("{Control>}z{/Control}");

  expect(treeRowNames(tree())).toEqual(before);
});

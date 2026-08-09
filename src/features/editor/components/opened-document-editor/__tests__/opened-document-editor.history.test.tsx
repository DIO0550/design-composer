import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/features/editor/__tests__/row-names";
import { renderOpenedDocument, selectInTree, tree } from "./setup";

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

  expect(rowNames(tree())).toEqual(ORIGINAL_CHILDREN);
});

test("戻したあとに Ctrl+Shift+Z を押すと並べ替えが再び反映される", async () => {
  await renderOpenedDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "home-title を下へ" }),
  );
  await userEvent.keyboard("{Control>}z{/Control}");

  await userEvent.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");

  expect(rowNames(tree())).toEqual(REORDERED_CHILDREN);
});

test("何も編集していないときに Ctrl+Z を押しても画面は変わらない", async () => {
  await renderOpenedDocument();

  await userEvent.keyboard("{Control>}z{/Control}");

  expect(rowNames(tree())).toEqual(ORIGINAL_CHILDREN);
});

test("削除を戻すと消したノードがツリーに返ってくる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await userEvent.keyboard("{Delete}");
  // 消えたことを先に見る。消えていないと、この後の Ctrl+Z が何もしなくても
  // 最後の assert が通ってしまう（削除の入口はキーだけになった / #112）。
  expect(rowNames(tree())).toEqual(["home-login"]);

  await userEvent.keyboard("{Control>}z{/Control}");

  expect(rowNames(tree())).toEqual(ORIGINAL_CHILDREN);
});

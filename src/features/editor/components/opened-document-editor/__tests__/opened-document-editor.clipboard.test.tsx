import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import {
  renderOpenedDocument,
  selectArtboard,
  selectInTree,
  tree,
} from "./setup";

/*
 * コピー & ペーストを、編集画面の配線ごと確かめる
 * （docs/06-ui.md「編集操作の一覧」/ #40）。
 *
 * キーボードからしか届かない操作なので、`EditorState` 単体のテストでは
 * 画面との繋がり（ショートカットの登録）を通らない。
 */

/** 開いた直後のツリーの行（今見ている artboard = home の配下）。 */
const OriginalRows = ["home-title", "home-login"];

test("配下のノードをコピーして貼ると自動で採番された複製が増える", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await userEvent.keyboard("{Control>}c{/Control}");

  await selectArtboard("home");
  await userEvent.keyboard("{Control>}v{/Control}");

  expect(rowNames(tree())).toEqual([
    "home-title",
    "home-login",
    "home-title-2",
  ]);
});

test("貼り付けたノードは選んでいない artboard には増えない", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await userEvent.keyboard("{Control>}c{/Control}");
  await selectArtboard("home");
  await userEvent.keyboard("{Control>}v{/Control}");

  await selectArtboard("settings");

  expect(rowNames(tree())).toEqual(["settings-card"]);
});

test("artboard を選んでコピーしても貼れるものは増えない", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.keyboard("{Control>}c{/Control}");
  await userEvent.keyboard("{Control>}v{/Control}");

  // artboard はノードとして貼れない（貼る先が「選択位置の子」なので入る場所が無い）。
  expect(rowNames(tree())).toEqual(OriginalRows);
});

test("コピーしていない状態で Ctrl+V を押してもツリーは変わらない", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.keyboard("{Control>}v{/Control}");

  expect(rowNames(tree())).toEqual(OriginalRows);
});

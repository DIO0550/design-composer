import { fireEvent, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  canvasSurface,
  enterPointer,
  holdAlt,
  sortedFacingDistanceLabels,
  stubBounds,
} from "@/features/editor/features/canvas/__tests__";
import { drawn, renderOpenedDocument, selectInTree } from "./setup";

/*
 * 選択しているだけのときの Alt / Option の距離のうち、キャンバスの外にある状態で止まるもの
 * （docs/06-ui.md「キャンバス直接操作」）。メニューの開閉と右ペインのフォーカスは編集画面
 * が持つので、配線ごとここで見る。
 *
 * `home-title`（左右 140〜240・上下 100〜130）を選ぶと、`home`（左右 100〜460・上下 60〜300）
 * の縁までは左 40・右 220・上 40・下 170。
 */

/** `home-title` を選び、`home` と一緒に描いて、ポインタをキャンバスの空き領域に置く。 */
async function selectTitleInCanvas(): Promise<void> {
  await renderOpenedDocument();
  await selectInTree("home-title");
  stubBounds(drawn("home"), { left: 100, top: 60, width: 360, height: 240 });
  stubBounds(drawn("home-title"), {
    left: 140,
    top: 100,
    width: 100,
    height: 30,
  });
  enterPointer(canvasSurface());
}

test("右クリックのメニューを開いている間は Alt を押しても距離が出ず、閉じると出る", async () => {
  await selectTitleInCanvas();
  fireEvent.contextMenu(drawn("home-title"), { clientX: 120, clientY: 80 });
  holdAlt();
  expect(sortedFacingDistanceLabels()).toEqual([]);

  // Alt を押したまま Esc で閉じる
  fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape", altKey: true });

  expect(sortedFacingDistanceLabels()).toEqual(["170", "220", "40", "40"]);
});

test("右ペインの Content の入力欄にフォーカスがあるときに Alt を押しても、距離は出ない", async () => {
  await selectTitleInCanvas();
  const field = screen.getByRole("textbox", { name: "Content" });
  field.focus();

  holdAlt(field);

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

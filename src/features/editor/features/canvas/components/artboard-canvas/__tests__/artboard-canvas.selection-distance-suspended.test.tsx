import { fireEvent } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  artboardHandle,
  canvasContent,
  canvasSurface,
} from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  enterPointer,
  holdAlt,
  holdSpace,
  leavePointer,
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  drawSelectionDistanceTree,
  selectionDistanceTree,
} from "@/features/editor/features/canvas/__tests__/selection-distance-tree";
import { PointerButtons } from "@/libs/dom-event";
import {
  drawnApart as drawnApartForResize,
  setupSelection as setupSelectionForResize,
} from "./resize-snap-siblings";
import {
  carryNode,
  drawn,
  renderCanvas,
  resizeHandleAt,
  sortedFacingDistanceLabels,
  withOnlySelected,
} from "./setup";
import { drawnApart, setupSiblings } from "./snap-siblings";

/*
 * 選択しているだけのときの Alt / Option の距離を出さないとき（docs/06-ui.md「キャンバス直接
 * 操作」）。どのテストも、止める理由が無ければ距離が出る指し先（キャンバスの空き領域か兄弟）
 * で Alt を押す。木の形と矩形は `selection-distance-tree`。
 */

test("ポインタがキャンバスの外へ出ると、距離は消える", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  movePointer(drawn("chip"), { x: 400, y: 120 });
  holdAlt();

  leavePointer(drawn("chip"));

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("複数選択では、Alt を押しても距離は出ない", () => {
  renderCanvas({ selection: selectionDistanceTree(["row", "title"]) });
  drawSelectionDistanceTree();
  enterPointer(canvasSurface());

  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("凍結中は、Alt を押しても距離は出ない", () => {
  renderCanvas({
    selection: selectionDistanceTree(["row"]),
    isFrozen: true,
  });
  drawSelectionDistanceTree();
  enterPointer(canvasSurface());

  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("リサイズハンドルを掴んでいる間は、Alt を押しても距離は出ない", () => {
  renderCanvas({ selection: setupSelectionForResize(["badge"]) });
  drawnApartForResize();
  enterPointer(canvasSurface());
  pressPointer(resizeHandleAt({ x: 1, y: 1 }), { x: 220, y: 120 });

  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("artboard を運んでいる間は、Alt を押しても距離は出ない", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  enterPointer(canvasSurface());
  pressPointer(artboardHandle("home"), { x: 0, y: 0 });
  movePointer(canvasContent(), { x: 30, y: 20 });

  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("範囲選択の最中は、Alt を押しても距離は出ない", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  enterPointer(canvasSurface());
  pressPointer(canvasSurface(), { x: 60, y: 40 });
  movePointer(canvasSurface(), { x: 170, y: 100 });

  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("範囲選択を終えると、また距離が出る", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  enterPointer(canvasSurface());
  pressPointer(canvasSurface(), { x: 60, y: 40 });
  movePointer(canvasSurface(), { x: 70, y: 50 });
  releasePointer(canvasSurface(), { x: 70, y: 50 });

  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual(["10", "120", "180", "20"]);
});

test("space でパンを構えている間は、Alt を押しても距離は出ない", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  enterPointer(canvasSurface());
  holdSpace();

  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("中ボタンでパンしている間は、Alt を押しても距離は出ない", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  enterPointer(canvasSurface());
  pressPointer(canvasSurface(), { x: 60, y: 40 }, PointerButtons.Middle);

  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("文言をその場で編集している間は、Alt を押しても距離は出ない", () => {
  renderCanvas({ selection: selectionDistanceTree(["title"]) });
  drawSelectionDistanceTree();
  enterPointer(canvasSurface());
  fireEvent.doubleClick(drawn("title"));

  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("Alt を押しながらノードを運んでいる間は、運んでいる間の距離だけが出る", () => {
  // 運んでいる間の距離は `artboard-canvas.facing-distance` の 1 件目と同じ
  renderCanvas({ selection: withOnlySelected(setupSiblings(), "badge") });
  drawnApart();
  enterPointer(canvasSurface());
  holdAlt();

  carryNode("badge", { x: 113, y: -12 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["12", "150", "190", "66"]);
});

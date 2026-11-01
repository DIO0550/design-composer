import { fireEvent } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  artboardHandle,
  canvasSurface,
} from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  enterPointer,
  holdAlt,
  leavePointerInto,
  movePointer,
  releaseAlt,
  wheel,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  drawSelectionDistanceTree,
  selectionDistanceTree,
} from "@/features/editor/features/canvas/__tests__/selection-distance-tree";
import { drawnApart, setupSelection } from "./resize-snap-siblings";
import {
  drawn,
  drawnAt,
  renderCanvas,
  resizeHandleAt,
  sortedFacingDistanceLabels,
  withOnlySelected,
} from "./setup";

/*
 * 選択しているだけのときに Alt / Option を押している間の、ポインタの下の相手との距離
 * （docs/06-ui.md「キャンバス直接操作」）。何と何を測るかは `distance-pair` が見るので、ここ
 * が見るのはキャンバスでの配線（指し先の伝わり方・キーの押し離し・測り直し）。
 *
 * 木の形と矩形は `selection-distance-tree`。`row`（左右 140〜340・上下 100〜160）を選ぶと、
 * 親 `card` の縁までは左 20・右 180・上 10・下 120、兄弟 `chip` までは右 40、別の枝の `title`
 * までは下 160。
 */

/** 指している位置。距離の向きは位置で決まらないので、どこでもよい。 */
const Anywhere = { x: 200, y: 120 };

test("Alt を押している間、左右に並ぶ兄弟を指すと、その間の距離が出る", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();

  movePointer(drawn("chip"), Anywhere);
  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual(["40"]);
});

test("Alt を押している間、上下に並ぶ別の枝のノードを指すと、その間の距離が出る", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();

  movePointer(drawn("title"), Anywhere);
  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual(["160"]);
});

test("Alt を押している間、選択の内側を指すと、親の内側の縁までの距離が出る", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();

  movePointer(drawn("label"), Anywhere);
  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual(["10", "120", "180", "20"]);
});

test("⌘ も押して選択の内側を指すと、いちばん内側の子孫から選択の内側の縁までの距離が出る", () => {
  // `label`（左右 170〜220・上下 115〜135）から `row` の縁まで
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();

  movePointer(drawn("label"), Anywhere, "meta");
  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual(["120", "15", "25", "30"]);
});

test("選択が祖先からはみ出している向きには、距離が出ない", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  // 左辺が `card` の左辺（120）より外へ出る
  drawnAt("row", { left: 110, top: 100, width: 230, height: 60 });

  movePointer(drawn("label"), Anywhere);
  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual(["10", "120", "180"]);
});

test("自分の artboard の背景を指すと、artboard の内側の縁までの距離が出る", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();

  movePointer(drawn("home"), Anywhere);
  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual(["300", "360", "40", "40"]);
});

test("別の artboard のノードを指すと、親の内側の縁までの距離が出る", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();

  movePointer(drawn("slot"), Anywhere);
  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual(["10", "120", "180", "20"]);
});

test("見出しの上へ移ると、親の内側の縁までの距離に変わる", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  movePointer(drawn("chip"), Anywhere);
  holdAlt();
  expect(sortedFacingDistanceLabels()).toEqual(["40"]);

  leavePointerInto(drawn("chip"), artboardHandle("home"));

  expect(sortedFacingDistanceLabels()).toEqual(["10", "120", "180", "20"]);
});

test("リサイズハンドルの上へ移ると、親の内側の縁までの距離に変わる", () => {
  /*
   * `badge`（左右 120〜220・上下 80〜120）の下に `marker`（上辺 160）があり、親 `home` は
   * 左右 100〜460・上下 60〜300（`resize-snap-siblings`）。
   */
  renderCanvas({ selection: setupSelection(["badge"]) });
  drawnApart();
  movePointer(drawn("marker"), Anywhere);
  holdAlt();
  expect(sortedFacingDistanceLabels()).toEqual(["40"]);

  leavePointerInto(drawn("marker"), resizeHandleAt({ x: 1, y: 1 }));

  expect(sortedFacingDistanceLabels()).toEqual(["180", "20", "20", "240"]);
});

test("倍率に合わせて、ドキュメント上の長さで出る", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  // 1.2 倍。画面上の 40 はドキュメント上の 33.3…
  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");

  movePointer(drawn("chip"), Anywhere);
  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual(["33"]);
});

test("Alt を押してから相手を指しても、距離が出る", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();

  holdAlt();
  movePointer(drawn("chip"), Anywhere);

  expect(sortedFacingDistanceLabels()).toEqual(["40"]);
});

test("Alt を押していない間は、相手を指しても距離が出ない", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();

  movePointer(drawn("chip"), Anywhere);

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("Alt を離すと、距離は消える", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  movePointer(drawn("chip"), Anywhere);
  holdAlt();

  releaseAlt();

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

test("キャンバスに入って空き領域にいる間に Alt を押すと、親の内側の縁までの距離が出る", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();

  enterPointer(canvasSurface());
  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual(["10", "120", "180", "20"]);
});

test("Alt を押したまま選択を変えると、新しい選択から測り直す", () => {
  const selection = selectionDistanceTree(["row"]);
  const { rerenderWith } = renderCanvas({ selection });
  drawSelectionDistanceTree();
  enterPointer(canvasSurface());
  holdAlt();

  // `title`（左右 140〜340・上下 320〜360）から `home` の縁まで
  rerenderWith(withOnlySelected(selection, "title"));

  expect(sortedFacingDistanceLabels()).toEqual(["100", "260", "360", "40"]);
});

test("Alt を押したままウィンドウの大きさが変わると、測り直す", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  movePointer(drawn("chip"), Anywhere);
  holdAlt();

  drawnAt("chip", { left: 400, top: 110, width: 100, height: 40 });
  fireEvent(globalThis.window, new Event("resize"));

  expect(sortedFacingDistanceLabels()).toEqual(["60"]);
});

test("大きさの無いノードを選んでいると、距離は出ない", () => {
  renderCanvas({ selection: selectionDistanceTree(["row"]) });
  drawSelectionDistanceTree();
  // 片方の辺だけ 0 にする。両方 0 だと、面積を見ずに測っても線が出ない
  drawnAt("row", { left: 140, top: 100, width: 0, height: 60 });

  enterPointer(canvasSurface());
  holdAlt();

  expect(sortedFacingDistanceLabels()).toEqual([]);
});

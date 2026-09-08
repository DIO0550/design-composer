import { screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import {
  drag,
  holdSpace,
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/canvas/__tests__/canvas-gesture";
import { PointerButtons } from "@/utils/PointerButton";
import { renderCanvas } from "./setup";
import { drawnApart, setupSiblings } from "./snap-siblings";

/**
 * 範囲を引く土台。artboard の上の `pointerdown` は枠と見出しが止めるので、
 * 範囲選択が始まるのはここへ届いたとき（＝ artboard の外側の余白）だけ。
 */
function canvasSurface(): Element {
  return screen.getByTestId("canvas-surface");
}

/** 出ている範囲の枠。引いていなければ空。 */
function rangeFrames(): readonly HTMLElement[] {
  return screen.queryAllByTestId("range-select");
}

/**
 * 空き領域から範囲を引いて離す。
 *
 * 起点を artboard の外（`home` の左上より外側）に取るのは、実際にそこからしか
 * 始められないため（`drawnApart` では `home` が (100, 60) から始まる）。
 */
function drawRange(to: Readonly<{ x: number; y: number }>): void {
  drag(canvasSurface(), { from: { x: 60, y: 40 }, to });
}

test("範囲に重なったノードが選ばれる", () => {
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectNodes });
  drawnApart();

  // `badge`（140-160 × 84-96）だけを含み、`card` / `marker` / `slot` には届かない範囲
  drawRange({ x: 170, y: 100 });

  expect(onSelectNodes).toHaveBeenCalledWith(["badge"]);
});

test("範囲に一部だけ重なったノードも選ばれる", () => {
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectNodes });
  drawnApart();

  // `badge` の左半分（140-150 × 84-90）だけに掛かる範囲
  drawRange({ x: 150, y: 90 });

  expect(onSelectNodes).toHaveBeenCalledWith(["badge"]);
});

test("範囲が孫まで覆っても、選ばれるのは artboard 直下の子だけ", () => {
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectNodes });
  drawnApart();

  // `card`（200-320 × 150-210）とその中の `label`（260-300 × 170-190）を覆い、
  // `marker`（上辺 200）には届かない範囲
  drawRange({ x: 310, y: 199 });

  expect(onSelectNodes).toHaveBeenCalledWith(["badge", "card"]);
});

test("範囲が artboard をまたいでも、入ったものはすべて選ばれる", () => {
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectNodes });
  drawnApart();

  // `home` の子 3 つと、隣の `settings` の子 `slot`（560-640 × 140-180）まで届く範囲
  drawRange({ x: 600, y: 250 });

  expect(onSelectNodes).toHaveBeenCalledWith([
    "badge",
    "marker",
    "card",
    "slot",
  ]);
});

test("artboard の枠だけを覆った範囲では何も選ばれない", () => {
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectNodes });
  drawnApart();

  // `home`（100-460 × 60-300）の左上に掛かるが、どの子にも届かない範囲
  drawRange({ x: 130, y: 70 });

  expect(onSelectNodes).toHaveBeenCalledWith([]);
});

test("何も入らない範囲を引くと、選択を空にするために呼ばれる", () => {
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectNodes });
  drawnApart();

  // どの artboard にも掛からない、下の余白の範囲
  drag(canvasSurface(), { from: { x: 60, y: 400 }, to: { x: 95, y: 430 } });

  expect(onSelectNodes).toHaveBeenCalledWith([]);
});

test("まだ描かれていないノードは、原点へ引いた範囲でも選ばれない", () => {
  /*
   * 要素が在っても未レイアウトなら実測は原点の 0×0 で返る。外し忘れると、
   * 画面の左上へ引いた範囲がそれらをまとめて拾う。
   * ここでは矩形を差し替えない（＝すべて 0×0 のまま）ことでその状態を作る。
   */
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectNodes });

  drag(canvasSurface(), { from: { x: 0, y: 0 }, to: { x: 40, y: 30 } });

  expect(onSelectNodes).toHaveBeenCalledWith([]);
});

test("空き領域を押して離すだけでは選択に手を付けない", () => {
  /*
   * 手ぶれで選択が外れると、クリックでは掘った状態から外へ戻らない
   * （docs/06-ui.md「キャンバスのクリックが選ぶ階層」）と食い違う。
   */
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectNodes });
  drawnApart();

  pressPointer(canvasSurface(), { x: 60, y: 40 });
  releasePointer(canvasSurface(), { x: 61, y: 41 });

  expect(onSelectNodes).not.toHaveBeenCalled();
});

test("引いている間は範囲の枠が出る", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  pressPointer(canvasSurface(), { x: 60, y: 40 });
  movePointer(canvasSurface(), { x: 170, y: 100 });

  expect(rangeFrames()).toHaveLength(1);
});

test("引いたあと離すと範囲の枠が消える", () => {
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  drawRange({ x: 170, y: 100 });

  expect(rangeFrames()).toHaveLength(0);
});

test("押しただけで動かしていないうちは範囲の枠を出さない", () => {
  /* 選ぶつもりのクリックのたびに 0 面積の枠が映るのを避ける（選ぶ閾値と揃える）。 */
  renderCanvas({ selection: setupSiblings() });
  drawnApart();

  pressPointer(canvasSurface(), { x: 60, y: 40 });

  expect(rangeFrames()).toHaveLength(0);
});

test("中ボタンのドラッグでは範囲の枠が出ず、選択も変わらない", () => {
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectNodes });
  drawnApart();

  drag(
    canvasSurface(),
    { from: { x: 60, y: 40 }, to: { x: 170, y: 100 } },
    PointerButtons.Middle,
  );

  expect(rangeFrames()).toHaveLength(0);
  expect(onSelectNodes).not.toHaveBeenCalled();
});

test("space を押しながらのドラッグでは範囲の枠が出ず、選択も変わらない", () => {
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectNodes });
  drawnApart();
  holdSpace();

  drag(canvasSurface(), { from: { x: 60, y: 40 }, to: { x: 170, y: 100 } });

  expect(rangeFrames()).toHaveLength(0);
  expect(onSelectNodes).not.toHaveBeenCalled();
});

test("他所で始まったドラッグを土台の上で離しても選択は変わらない", () => {
  /*
   * パレットの行から運んで土台の上で離す経路が現にある
   * （`opened-document-editor.asset-drag`）。始めていない操作の終わりで選択を
   * 空にすると、配置のたびに選択が消える。
   */
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectNodes });
  drawnApart();

  releasePointer(canvasSurface(), { x: 170, y: 100 });

  expect(onSelectNodes).not.toHaveBeenCalled();
});

test("凍結中は範囲選択が始まらない", () => {
  /*
   * 映っているのは最後に正常だった表示なので、そこへ加えた選択は今のファイルと
   * 噛み合わない。`canvas-content` の `inert` は土台まで及ばないので、ここで止める。
   */
  const onSelectNodes = vi.fn();
  renderCanvas({ selection: setupSiblings(), isFrozen: true, onSelectNodes });
  drawnApart();

  drawRange({ x: 170, y: 100 });

  expect(rangeFrames()).toHaveLength(0);
  expect(onSelectNodes).not.toHaveBeenCalled();
});

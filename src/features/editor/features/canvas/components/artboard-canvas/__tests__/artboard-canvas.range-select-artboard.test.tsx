import { fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { rangeFrames } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  drag,
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { drawn, renderCanvas, withOnlySelected } from "./setup";
import { drawnApart, setupSiblings } from "./snap-siblings";

/**
 * `home` の背景（子が乗っていないところ）から範囲を引いて離す。
 *
 * 押すのは枠の `role="button"` ではなく**描かれた artboard そのもの**（`drawn`）。実ブラウザ
 * で背景を押したときの `event.target` はこちら。起点の (105, 65) は `home`（100-460 ×
 * 60-300）の左上の隅で、どの子にも掛からない。
 *
 * @param to 離す位置
 */
function drawRangeFromBackground(to: Readonly<{ x: number; y: number }>): void {
  drag(drawn("home"), { from: { x: 105, y: 65 }, to });
}

test("artboard の背景から引くと、範囲に重なったノードが選ばれる", () => {
  const onSelectInRange = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectInRange });
  drawnApart();

  // `badge`（140-160 × 84-96）だけを含み、`card` / `marker` には届かない範囲
  drawRangeFromBackground({ x: 170, y: 100 });

  expect(onSelectInRange).toHaveBeenCalledWith(["badge"]);
});

test("artboard の背景から引いた範囲は、隣の artboard の子も選ぶ", () => {
  const onSelectInRange = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectInRange });
  drawnApart();

  // `home` の子 3 つと、隣の `settings` の子 `slot`（560-640 × 140-180）まで届く範囲
  drawRangeFromBackground({ x: 600, y: 250 });

  expect(onSelectInRange).toHaveBeenCalledWith([
    "badge",
    "marker",
    "card",
    "slot",
  ]);
});

test("artboard の背景を押して離すだけなら、範囲選択として選び直さない", () => {
  const onSelectInRange = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectInRange });
  drawnApart();

  pressPointer(drawn("home"), { x: 105, y: 65 });
  releasePointer(drawn("home"), { x: 106, y: 66 });

  expect(onSelectInRange).not.toHaveBeenCalled();
});

test("artboard の背景を押して離したクリックでは、その artboard が選ばれる", () => {
  /*
   * 押して離しただけで飲み込み待ちに入ると、背景のクリックで artboard を選べなくなる。
   * 実ブラウザで click が枠へ届くこと（捕捉先）は happy-dom では確かめられない
   * （`useRangeSelect` の `captureTargetOf`）。
   */
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelect });
  drawnApart();

  pressPointer(drawn("home"), { x: 105, y: 65 });
  releasePointer(drawn("home"), { x: 106, y: 66 });
  fireEvent.click(drawn("home"));

  expect(onSelect).toHaveBeenCalledWith(["home"], SelectionDigs.NoDeeper);
});

test("artboard の背景から範囲を引いた直後の click では、artboard が選ばれない", () => {
  /*
   * click は捕捉した要素（押した artboard）に出て枠まで上がる。飲み込まないと、範囲で
   * 選んだものが artboard の選択で上書きされる。
   */
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelect });
  drawnApart();

  drawRangeFromBackground({ x: 170, y: 100 });
  fireEvent.click(drawn("home"));

  expect(onSelect).not.toHaveBeenCalled();
});

test("動かさないまま離れた位置で離しても、直後の click では artboard が選ばれない", () => {
  /*
   * 最後の `pointermove` と離した位置が違う入力。離した位置まで範囲を伸ばしてから
   * 離さないと、選び直しは届くのに飲み込み待ちに入らず、artboard の選択で上書きされる。
   */
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelect });
  drawnApart();

  pressPointer(drawn("home"), { x: 105, y: 65 });
  releasePointer(drawn("home"), { x: 170, y: 100 });
  fireEvent.click(drawn("home"));

  expect(onSelect).not.toHaveBeenCalled();
});

test("範囲を引いた直後の click を飲み込んだあとは、次のクリックで選べる", () => {
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelect });
  drawnApart();

  drawRangeFromBackground({ x: 170, y: 100 });
  fireEvent.click(drawn("home"));
  fireEvent.click(drawn("settings"));

  expect(onSelect).toHaveBeenCalledWith(["settings"], SelectionDigs.NoDeeper);
});

test("範囲を引いて離したあと click が来ないまま中身を押しても、そのクリックで選べる", () => {
  /*
   * 離したあとの click が来ないまま次の操作が始まると、飲み込み待ちが残る。中身の
   * ノードを押すと枠が `pointerdown` を止めるので、解くのは土台の capture でしか届かない。
   */
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelect });
  drawnApart();

  drawRangeFromBackground({ x: 170, y: 100 });
  pressPointer(drawn("badge"), { x: 150, y: 90 });
  releasePointer(drawn("badge"), { x: 150, y: 90 });
  fireEvent.click(drawn("badge"));

  expect(onSelect).toHaveBeenCalledWith(
    ["badge", "home"],
    SelectionDigs.NoDeeper,
  );
});

test("引いている途中で捕捉が外れると、そのあと動かしても選び直さない", () => {
  // `pointercancel` などで離さないまま捕捉が外れると `pointerup` が来ず、引き続けてしまう
  const onSelectInRange = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectInRange });
  drawnApart();

  pressPointer(drawn("home"), { x: 105, y: 65 });
  movePointer(drawn("home"), { x: 170, y: 100 });
  fireEvent.lostPointerCapture(drawn("home"));
  onSelectInRange.mockClear();
  movePointer(drawn("home"), { x: 600, y: 250 });

  expect(onSelectInRange).not.toHaveBeenCalled();
});

test("範囲を引いて離したあと捕捉が外れても、直後の click では artboard が選ばれない", () => {
  // 捕捉は離したときにも外れる（`pointerup` → `lostpointercapture` → `click` の順）
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelect });
  drawnApart();

  drawRangeFromBackground({ x: 170, y: 100 });
  fireEvent.lostPointerCapture(drawn("home"));
  fireEvent.click(drawn("home"));

  expect(onSelect).not.toHaveBeenCalled();
});

test("artboard の中身を掴んで動かしたときは、範囲選択にならない", () => {
  const onSelectInRange = vi.fn();
  renderCanvas({ selection: setupSiblings(), onSelectInRange });
  drawnApart();

  drag(drawn("badge"), { from: { x: 150, y: 90 }, to: { x: 300, y: 250 } });

  expect(rangeFrames()).toHaveLength(0);
  expect(onSelectInRange).not.toHaveBeenCalled();
});

test("選択中の artboard のリサイズの帯を掴んで動かしたときは、範囲選択にならない", () => {
  // `home` の右辺（x=460）の内側 2px を押すと、幅のリサイズの帯を掴む
  const onSelectInRange = vi.fn();
  renderCanvas({
    selection: withOnlySelected(setupSiblings(), "home"),
    onSelectInRange,
  });
  drawnApart();

  drag(drawn("home"), { from: { x: 458, y: 280 }, to: { x: 520, y: 290 } });

  expect(rangeFrames()).toHaveLength(0);
  expect(onSelectInRange).not.toHaveBeenCalled();
});

test("凍結中は artboard の背景から引いても範囲選択にならない", () => {
  const onSelectInRange = vi.fn();
  renderCanvas({ selection: setupSiblings(), isFrozen: true, onSelectInRange });
  drawnApart();

  drawRangeFromBackground({ x: 170, y: 100 });

  expect(rangeFrames()).toHaveLength(0);
  expect(onSelectInRange).not.toHaveBeenCalled();
});

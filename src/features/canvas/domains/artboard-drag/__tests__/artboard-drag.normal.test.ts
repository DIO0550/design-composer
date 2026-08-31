import { expect, test } from "vitest";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";
import { ArtboardDrag } from "../index";

/**
 * `home` を掴んだ状態。
 * 掴んだ時点の位置と押した位置を別の値にして、取り違えを落とせるようにする。
 *
 * @returns 掴んだだけで、まだ動かしていない状態
 */
function heldDrag(): ArtboardDrag {
  return ArtboardDrag.grab({
    name: "home",
    grabbedAt: { x: 100, y: 40 },
    pointerOrigin: { x: 500, y: 300 },
  });
}

test("閾値を越えて動かすと、掴んだ時点の位置に移動量を足した座標を運んでいる", () => {
  // 縦横を別の量にする（取り違えても同じ答えになる入力を避ける）
  const dragging = ArtboardDrag.moveTo(heldDrag(), { x: 560, y: 380 });

  expect(ArtboardDrag.preview(dragging, CanvasView.create())).toEqual(
    Option.some({ name: "home", canvasPosition: { x: 160, y: 120 } }),
  );
});

test("閾値までの動きでは運んでいるものが決まらない", () => {
  // 3px は閾値（4px）未満なのでクリックとして扱う
  const held = ArtboardDrag.moveTo(heldDrag(), { x: 503, y: 300 });

  expect(ArtboardDrag.preview(held, CanvasView.create())).toEqual(Option.none);
});

test("倍率を上げても、動く量はドキュメント上の px になる", () => {
  /*
   * 画面上の移動量は倍率で割り戻す。割り戻さないと、拡大するほど掴んだ点から離れていく。
   * ここで整数へ丸めないのは、丸めるのがファイルへ書く側（`Artboard.withCanvasPosition`）
   * のため。運んでいる間の見た目は小数のままで構わない。
   */
  const zoomed = CanvasView.zoomIn(CanvasView.zoomIn(CanvasView.create()));
  const dragging = ArtboardDrag.moveTo(heldDrag(), { x: 620, y: 300 });

  const moved = Option.unwrap(ArtboardDrag.preview(dragging, zoomed));

  expect(moved.canvasPosition.x - 100).toBeCloseTo(120 / zoomed.scale);
});

test("掴んでいないときは運んでいるものが決まらない", () => {
  expect(
    ArtboardDrag.preview(ArtboardDrag.create(), CanvasView.create()),
  ).toEqual(Option.none);
});

import { Offset } from "@/domains/unit/offset";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { ArtboardDrag } from "../index";

/**
 * `home` を掴んだ状態。
 * 掴んだ時点の位置と押した位置を別の値にして、取り違えを落とせるようにする。
 *
 * @returns 掴んだだけで、まだ動かしていない状態
 */
export function heldDrag(): ArtboardDrag {
  return ArtboardDrag.grab({
    name: "home",
    grabbedAt: { x: 100, y: 40 },
    pointerOrigin: { x: 500, y: 300 },
  });
}

/**
 * 掴んだ時点の `home` が描かれている矩形（等倍・原点で見ているので、画面上の位置が
 * 掴んだ時点の座標と一致する）。
 */
export const HomeDrawn: CanvasBounds = {
  left: 100,
  top: 40,
  width: 200,
  height: 100,
};

/**
 * 押した位置からその量だけ動かしたポインタの位置。
 *
 * @param by 押した位置から動かす量（画面上の px）
 * @returns 画面上のポインタの位置
 */
export function pointerBy(by: Offset): Offset {
  return Offset.add({ x: 500, y: 300 }, by);
}

/**
 * 寄せ量とガイド線を求めて、その位置まで運ぶ（`useArtboardDrag` が 1 回の移動でやることと同じ）。
 *
 * @param drag 今のドラッグの状態（`carried` を描いたときの状態）
 * @param pointer 画面上のポインタの位置
 * @param drawn 運んでいる artboard と揃え先の実測
 * @returns 運んだあとの状態
 */
export function moveSnapped(
  drag: ArtboardDrag,
  pointer: Offset,
  drawn: Parameters<typeof ArtboardDrag.snappedAt>[2],
): ArtboardDrag {
  const snapped = ArtboardDrag.snappedAt(drag, pointer, drawn);
  return ArtboardDrag.moveTo(drag, { pointer, snapped });
}

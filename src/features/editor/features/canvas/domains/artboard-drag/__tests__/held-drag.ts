import { Offset } from "@/domains/unit/offset";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { ArtboardDrag, type ArtboardPointerInput } from "../index";

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

/** 揃え先に置く artboard が描かれている矩形（画面上の px）。 */
export const StationaryDrawn: CanvasBounds = {
  left: 400,
  top: 300,
  width: 150,
  height: 80,
};

/**
 * まだレイアウトされていない `home` の実測（原点の 0×0）と、その原点の辺の近くに置いた揃え先。
 * 大きさの無い実測から行き先を作ると、揃え先の左辺（0）へ吸い付いてしまう入力。
 */
export const UnlaidOutDrawn = {
  carried: { left: 0, top: 0, width: 0, height: 0 },
  others: [{ left: 0, top: 500, width: 100, height: 100 }],
} as const satisfies Parameters<typeof ArtboardDrag.snappedAt>[2];

/**
 * 押した位置からその量だけ動かしたポインタの 1 回分の入力。
 *
 * @param by 押した位置から動かす量（画面上の px）
 * @returns 画面上のポインタの位置と、吸い付くか・測るか（既定は吸い付いて測らない）
 */
export function pointerBy(
  by: Offset,
  { snaps = true, measuresDistances = false } = {},
): ArtboardPointerInput {
  return {
    pointer: Offset.add({ x: 500, y: 300 }, by),
    snaps,
    measuresDistances,
  };
}

/**
 * 寄せ量とガイド線を求めて、その位置まで運ぶ（`useArtboardDrag` が 1 回の移動でやることと同じ）。
 *
 * @param drag 今のドラッグの状態（`carried` を描いたときの状態）
 * @param input 画面上のポインタの位置と、吸い付くか・測るか
 * @param drawn 運んでいる artboard と他の artboard の実測
 * @returns 運んだあとの状態
 */
export function moveSnapped(
  drag: ArtboardDrag,
  input: ArtboardPointerInput,
  drawn: Parameters<typeof ArtboardDrag.snappedAt>[2],
): ArtboardDrag {
  const snapped = ArtboardDrag.snappedAt(drag, input, drawn);
  return ArtboardDrag.moveTo(drag, { pointer: input.pointer, snapped });
}

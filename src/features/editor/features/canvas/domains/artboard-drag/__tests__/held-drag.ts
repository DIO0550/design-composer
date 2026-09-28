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

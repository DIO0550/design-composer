import type { Offset } from "@/domains/unit/offset";
import {
  artboardFrameContainer,
  artboardHandle,
  canvasContent,
} from "@/features/editor/features/canvas/__tests__/canvas-elements";
import { drag } from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { drawn, selectionFromArtboards } from "./setup";

/**
 * 200 × 140 の artboard を 3 枚、既定の位置（x = 0 / 232 / 464、y = 0）に並べた未選択の対。
 *
 * @returns 3 枚の artboard を持つドキュメントと、未選択の対
 */
export function setupSelection() {
  return selectionFromArtboards([
    { name: "first", width: 200, height: 140, children: [] },
    { name: "second", width: 200, height: 140, children: [] },
    { name: "third", width: 200, height: 140, children: [] },
  ]);
}

/**
 * artboard の実測を、その枠（`li`）が今置かれている位置に追従させる。
 *
 * 固定の矩形を返す差し替えだと、運んで描き直したあとも掴んだ時点の位置を返し続ける。
 * 実ブラウザの実測には前回までの運搬ぶんが乗るので、それを写す（等倍・原点で見ている
 * ので、画面上の位置がキャンバス上の座標と一致する）。
 *
 * @param name 追従させる artboard の名前
 */
export function drawnFollowingFrame(name: string): void {
  drawn(name).getBoundingClientRect = () => {
    const { style } = artboardFrameContainer(canvasContent(), name);
    return new DOMRect(
      Number.parseFloat(style.left),
      Number.parseFloat(style.top),
      200,
      140,
    );
  };
}

/**
 * 3 枚すべての実測を、それぞれの枠が今置かれている位置に追従させる。
 */
export function drawnFollowingFrames(): void {
  for (const name of ["first", "second", "third"]) {
    drawnFollowingFrame(name);
  }
}

/**
 * `second` の見出しを掴み、押した位置からその量だけ動かして離す。
 *
 * @param by 押した位置から動かす量（画面上の px）
 */
export function dragSecond(by: Offset): void {
  drag(artboardHandle("second"), { from: { x: 0, y: 0 }, to: by });
}

import type { ReactElement } from "react";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import { SelectionColor } from "../artboard-frame-list";

/**
 * 空き領域から引いている選択の範囲（docs/06-ui.md「範囲選択」）。
 *
 * 色は選択の枠と同じ青（`SelectionColor`）。この矩形が示すのは**これから選ばれる範囲**で、
 * 選択そのものと同じ意味の系統に属する。緑（落とし先の枠）と赤（辺のスナップ）は
 * 運んでいる間に出るもので、範囲選択とは同時に出ない。塗りを薄く敷くのは、線だけだと
 * 中身の上で辺を見失うため。UI 案（docs/Design Composer.html）にこの状態の絵は無い。
 *
 * ズーム / パンの変形の**外側**に置き、実測した client 座標をそのまま `position: fixed` で
 * 使う（`DropMarker` / `SnapGuideOverlay` と同じ理由 — 変形の内側は React の管理外）。
 * そのため引いたまま左右のペインの上まで出ると矩形もそこへ伸びるが、器からの相対へ
 * 直すにはレンダー中に器を実測する必要があり、実測を持つ `useDrawnBounds` は名前で引く
 * 形なので噛み合わない。引いている間だけの一過性の見え方なので、そのままにしている。
 *
 * `pointer-events-none` を外すと、矩形の下を通った `pointermove` の `target` が矩形になる。
 *
 * @returns 引いている範囲を示す矩形
 */
export function RangeSelectOverlay({
  bounds,
}: Readonly<{ bounds: CanvasBounds }>): ReactElement {
  return (
    <div
      data-testid="range-select"
      aria-hidden
      className="pointer-events-none fixed z-10"
      style={{
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
        border: `1px solid ${SelectionColor}`,
        backgroundColor: `${SelectionColor}1a`,
      }}
    />
  );
}

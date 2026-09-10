import type { ReactElement } from "react";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import { SelectionColor } from "../artboard-frame-list";

/**
 * 空き領域から引いている選択の範囲（docs/06-ui.md「範囲選択」）。UI 案（docs/Design
 * Composer.html）にこの状態の絵は無い。
 *
 * 色は選択の枠と同じ青（`SelectionColor`）。この矩形が示すのは**これから選ばれる範囲**
 * で、選択そのものと同じ意味の系統に属する（緑の落とし先と赤の辺のスナップは運んでいる
 * 間に出るもので、範囲選択とは同時に出ない）。塗りを薄く敷くのは、線だけだと中身の上で
 * 辺を見失うため。
 *
 * ズーム / パンの変形の**外側**に置き、実測した client 座標をそのまま `position: fixed`
 * で使う（`DropMarker` / `SnapGuideOverlay` と同じ理由 — 変形の内側は React の管理外）。
 * そのため引いたまま左右のペインの上まで出ると矩形もそこへ伸びるが、器からの相対へ直す
 * にはレンダー中に器を実測する必要があり、名前で引く `useDrawnBounds` と噛み合わない。
 * 引いている間だけの一過性の見え方なのでそのままにしている。
 *
 * `pointer-events-none` は、この矩形が土台（`canvas-surface`）の**兄弟**として重なるた
 * め。引いている間は土台がポインタを捕捉していて**外してもテストも絵も変わらない**が、
 * 捕捉が成立しない場面では矩形がイベントを飲み込む。
 *
 *   @returns 引いている範囲を示す矩形
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

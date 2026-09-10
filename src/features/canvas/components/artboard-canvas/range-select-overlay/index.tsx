import type { ReactElement } from "react";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import { SelectionColor } from "../artboard-frame-list";

/**
 * 空き領域から引いている選択の範囲（docs/06-ui.md「範囲選択」）。UI 案 docs/Design
 * Composer.html にこの状態の絵は無い。
 *
 * 色は選択の枠と同じ青（`SelectionColor`）。示すのは**これから選ばれる範囲**で、選択と
 * 同じ意味の系統に属する（緑の落とし先と赤の辺のスナップは運んでいる間だけ出る）。塗り
 * を薄く敷くのは、線だけだと中身の上で辺を見失うため。
 *
 * ズーム / パンの変形の**外側**に置き、実測した client 座標を `position: fixed` で使う
 * （変形の内側は React の管理外。器からの相対へ直すにはレンダー中の実測が要り、名前で引
 * く `useDrawnBounds` と噛み合わない）。`pointer-events-none` は土台の**兄弟**として重
 * なるためで、引いている間は土台が捕捉していて**外してもテストも絵も変わらない**。
 *
 *       @returns 引いている範囲を示す矩形
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

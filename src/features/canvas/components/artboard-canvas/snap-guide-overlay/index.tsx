import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import type { SnapGuides } from "@/features/canvas/domains/side-snap";

/**
 * ガイド線 1 本。
 *
 * `pointer-events-none` を外すと、線の下を通った `pointermove` の `target` が線になり、
 * 落とし先の親を辿れなくなる（`useNodeDrag` は `event.target` から名前を辿る）。
 * **外しても絵は変わらないので、テストでも視覚差分でも気づけない。**
 *
 * ズーム / パンの変形の**外側**に置き、実測した client 座標をそのまま `position: fixed`
 * で使う（`DropMarker` と同じ理由 — 変形の内側は React の管理外なので線を差し込めない）。
 */
function GuideLine({ bounds }: Readonly<{ bounds: CanvasBounds }>) {
  return (
    <div
      data-testid="snap-guide"
      aria-hidden
      className="pointer-events-none fixed z-10 bg-[#d13438]"
      style={{
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      }}
    />
  );
}

/**
 * 揃った辺に引くガイド線（docs/06-ui.md「キャンバス直接操作」の辺のスナップ。
 * 色・太さの選定理由もそちらにある）。どこへ引くかは `side-snap` が実測から決める。
 *
 * 軸ごとに 1 本ずつ並べて出すのは、受け取る型がそう持っているから（`SnapGuides`）。
 * 並びを `map` しないので、線の同一性を key で作る必要が無い。
 *
 * Why not（紫 `#9747ff`）: UI 案ではキャンバス上のインスタンスの表示に使っており、
 * 運んでいる最中に同じ画面へ出るため意味が割れる。
 */
export function SnapGuideOverlay({ guides }: Readonly<{ guides: SnapGuides }>) {
  return (
    <>
      {guides.horizontal.some ? (
        <GuideLine bounds={guides.horizontal.value} />
      ) : null}
      {guides.vertical.some ? (
        <GuideLine bounds={guides.vertical.value} />
      ) : null}
    </>
  );
}

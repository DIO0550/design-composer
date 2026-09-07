import type { CanvasBounds } from "@/features/canvas/domains/node-drop";

/**
 * 揃った辺に引くガイド線（docs/06-ui.md「キャンバス直接操作」の辺のスナップ）。
 * 縦横それぞれ最大 1 本で、どこへ引くかは `side-snap` が実測から決める。
 *
 * ズーム / パンの変形の**外側**に置き、実測した client 座標をそのまま `position: fixed`
 * で使う（`DropMarker` と同じ理由 — 変形の内側は React の管理外なので線を差し込めない）。
 *
 * Why（色 `#d13438`）: 運んでいる間は選択の枠（青 `#3b82f6`）・落とし先の枠（緑
 * `#10b981`）・トークン参照（青 `#0d99ff`）が同時に出るので青系と緑系は取れない。
 * UI 案 docs/Design Composer.html が宣言している色のうち残るのがこの赤で、参考にしている
 * Figma のスマートガイドも赤系（#445）。
 *
 * Why not（部品の紫 `#9747ff`）: UI 案ではキャンバス上のインスタンスの表示に使っており、
 * 運んでいる最中に同じ画面へ出るため意味が割れる。
 */
export function SnapGuideOverlay({
  guides,
}: Readonly<{ guides: readonly CanvasBounds[] }>) {
  return (
    <>
      {guides.map((guide) => (
        <div
          // 同じ辺に 2 本引くことは無いので、位置がそのまま線の識別になる
          key={`${guide.left},${guide.top}`}
          data-testid="snap-guide"
          aria-hidden
          className="pointer-events-none fixed z-10 bg-[#d13438]"
          style={{
            left: `${guide.left}px`,
            top: `${guide.top}px`,
            width: `${guide.width}px`,
            height: `${guide.height}px`,
          }}
        />
      ))}
    </>
  );
}

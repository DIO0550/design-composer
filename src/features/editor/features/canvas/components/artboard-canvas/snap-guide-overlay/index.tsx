import type { ReactElement } from "react";
import { type SidePair, SidePairs } from "@/domains/unit/side";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import type { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import {
  type GapReadout,
  SideSnap,
  type SnapGuides,
} from "@/features/editor/features/canvas/domains/side-snap";
import { Option } from "@/utils/Option";

/**
 * 実測した client 座標の矩形を、そのまま `position: fixed` の位置と大きさにする。
 *
 * @param bounds 描く矩形（画面上の px）
 * @returns `style` に渡す位置と大きさ
 */
function fixedAt(bounds: CanvasBounds) {
  return {
    left: `${bounds.left}px`,
    top: `${bounds.top}px`,
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
  };
}

/**
 * ガイド線 1 本。
 *
 * `pointer-events-none` を外すと、線の下を通った `pointermove` の `target` が線になり、
 * 落とし先の親を辿れなくなる（`useNodeDrag` は `event.target` から名前を辿る）。
 * **外しても絵は変わらないので、テストでも視覚差分でも気づけない。** 隙間の短い線と
 * 数値も同じ。
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
      style={fixedAt(bounds)}
    />
  );
}

/**
 * 揃え先との隙間に引く短い線と、その中点に置く数値。
 *
 * 数値を短い線の子にして中央へ寄せるので、中点の座標を計算しない。寄せる class を外しても
 * テストは 1 件も落ちない（happy-dom はレイアウトを持たない）。気づく手段は story の視覚差分だけ。
 */
function GapLine({ readout }: Readonly<{ readout: GapReadout }>) {
  return (
    <div
      data-testid="snap-gap"
      aria-hidden
      className="pointer-events-none fixed z-10 bg-[#d13438]"
      style={fixedAt(readout.gapLine)}
    >
      <span
        data-testid="snap-gap-label"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-[3px] bg-[#d13438] px-1.5 py-0.5 font-medium text-[10px] text-white"
      >
        {readout.length}
      </span>
    </div>
  );
}

/**
 * 1 つの軸のスマートガイド。ガイド線と、揃え先から離れていれば隙間の短い線と数値。
 *
 * @returns ガイド線と隙間の表示。その軸に揃った線が無ければ `null`
 */
function Guide({
  guides,
  pair,
  view,
}: Readonly<{
  guides: SnapGuides;
  pair: SidePair;
  view: CanvasView;
}>): ReactElement | null {
  const guide = guides[pair];
  if (!Option.isSome(guide)) {
    return null;
  }
  const readout = SideSnap.toGapReadout(guides, pair, view);
  return (
    <>
      <GuideLine bounds={guide.value.guideLine} />
      {Option.isSome(readout) ? <GapLine readout={readout.value} /> : null}
    </>
  );
}

/**
 * 揃った線（辺か中心線）に引くガイド線と、揃え先との隙間の数値（docs/06-ui.md「キャンバス
 * 直接操作」の辺のスナップ。色・太さ・数値の単位の選定理由もそちらにある）。どこへ引くかは
 * `side-snap` が実測から決める。
 *
 * 並びを `map` しないので、線の同一性を key で作る必要が無い。
 */
export function SnapGuideOverlay({
  guides,
  view,
}: Readonly<{ guides: SnapGuides; view: CanvasView }>) {
  return (
    <>
      <Guide guides={guides} pair={SidePairs.Horizontal} view={view} />
      <Guide guides={guides} pair={SidePairs.Vertical} view={view} />
    </>
  );
}

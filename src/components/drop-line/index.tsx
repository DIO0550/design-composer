import type { ReactElement } from "react";
import type { ValueOf } from "@/types/ValueOf";
import type { DropSide } from "@/utils/ReorderDrag";

/** テストから引くための目印。キャンバスの `DropMarker` と同じ扱い。 */
export const DropLineTestId = "drop-line";

/** 線を引く並びが、要素を縦に積んでいるか横に並べているか。 */
export const ListOrientations = {
  /** 行を上から下へ積む並び（左ペインのツリー・`Artboards`）。 */
  Vertical: "vertical",
  /** 左から右へ並べる並び（タブ列）。 */
  Horizontal: "horizontal",
} as const;

export type ListOrientation = ValueOf<typeof ListOrientations>;

/** 並びの向きと落ちる側から決まる、線を置く縁。 */
const LineEdges = {
  [ListOrientations.Vertical]: {
    before: "inset-x-0 top-0 h-0.5",
    after: "inset-x-0 bottom-0 h-0.5",
  },
  [ListOrientations.Horizontal]: {
    before: "inset-y-0 left-0 w-0.5",
    after: "inset-y-0 right-0 w-0.5",
  },
} as const satisfies Record<ListOrientation, Record<DropSide, string>>;

/**
 * 並べ替えで落ちる先を示す線。縦に積む並びでは行の上 / 下の縁に、横に並べる並びでは
 * 要素の左 / 右の縁に引く。
 *
 * UI 案は並べ替えの提示を描いていないが、キャンバスのドラッグには挿入位置の線を
 * `#0d99ff`（3px）で描いているので、同じ「落ちる先を示す線」として色をそちらへ合わせた
 * （キャンバスの `DropMarker` の緑は選択の枠と同時に出るための色で、並びの中では要らない）。
 *
 * UI 案は docs/Design Composer.html。代わりに `data-testid` / `data-side` /
 * `data-orientation` を持たせるのは、class にしか出ない形にすると happy-dom では読めない
 * から（太さ・色・縁は class にしか出ないので、確かめる手段は自分のストーリーの視覚差分だけ）。
 *
 * @param side 入った要素のどちら側に落ちるか
 * @param listOrientation 線を引く並びの向き。線そのものの向きではない
 * @returns 落ちる先を示す 2px の線
 */
export function DropLine({
  side,
  listOrientation,
}: Readonly<{
  side: DropSide;
  listOrientation: ListOrientation;
}>): ReactElement {
  return (
    <span
      data-testid={DropLineTestId}
      data-side={side}
      data-orientation={listOrientation}
      aria-hidden
      className={`pointer-events-none absolute bg-[#0d99ff] ${LineEdges[listOrientation][side]}`}
    />
  );
}

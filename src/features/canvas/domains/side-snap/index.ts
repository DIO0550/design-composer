import type { Offset } from "@/domains/unit/offset";
import { SidePair, SidePairs } from "@/domains/unit/side";
import { CanvasBounds } from "@/features/canvas/domains/node-drop";

/**
 * 辺のスナップ 1 回分（運んでいるものの行き先と、揃え先の並び。すべて画面上の px。
 * docs/06-ui.md「キャンバス直接操作」）。
 *
 * Why: 寄せ量は**運んでいるものの行き先と、揃え先の並びの両方**で決まり、片方だけでは
 * 答えが出ない。そのため対を表す型にして、そこへ判定を帰属させる
 * （rules/architecture.md「2つの値が常に対で意味を持つなら対を表す型を作る」）。
 *
 * Why not（`Edge` ではなく `Side`）: このリポジトリで 4 辺を指す語彙は `unit/side` の
 * `Side` で、`edge` は `CanvasBounds.edge` が**終端（右辺 / 下辺）だけ**を指す狭い意味で
 * 既に使っている。`Edge` で名付けると、grep した読み手が右下だけの話に着地する。
 */
export type SideSnap = Readonly<{
  moving: CanvasBounds;
  stationary: readonly CanvasBounds[];
}>;

export const SideSnap = {
  /**
   * 揃うとみなす距離（**画面上の px**）。
   *
   * Why（画面上の px）: 倍率を変えても吸い付く手応えが変わらないようにするため。
   * ドキュメント上の px で持つと、拡大するほど広い範囲で吸い付いて狙った位置へ置けなくなる。
   */
  ThresholdPx: 6,

  /**
   * 判定する組を作る。
   *
   * @param moving 運んでいるものの行き先の矩形
   * @param stationary 揃える先の矩形の並び（近さが同じときは先にあるほうへ寄る）
   * @returns 揃えの判定に使う組
   */
  create(moving: CanvasBounds, stationary: readonly CanvasBounds[]): SideSnap {
    return { moving, stationary };
  },

  /**
   * 揃う位置へ寄せる量。
   *
   * @param snap 判定する組
   * @returns 寄せ量（画面上の px）。閾値に届く辺の組が無ければ縦横とも 0
   */
  toOffset(snap: SideSnap): Offset {
    return {
      x: shiftAlong(snap, SidePairs.Horizontal),
      y: shiftAlong(snap, SidePairs.Vertical),
    };
  },
} as const;

/**
 * 向かい合う 2 辺の組ごとの寄せ量。
 *
 * 運んでいるものの 2 辺と、揃え先それぞれの 2 辺を総当たりで比べ、閾値に届くうち
 * **いちばん近い組**へ寄せる。同じ距離の組が 2 つあるときは先に見つけたほう
 * （＝揃え先の並び順）を採る。
 *
 * @param snap 判定する組
 * @param pair 見る 2 辺の組（水平なら左右＝x、垂直なら上下＝y）
 * @returns その向きの寄せ量。閾値に届く組が無ければ 0
 */
function shiftAlong(snap: SideSnap, pair: SidePair): number {
  const sides = SidePair.sides(pair);
  const shifts = snap.stationary.flatMap((stationary) =>
    sides.flatMap((stationarySide) =>
      sides.map(
        (movingSide) =>
          CanvasBounds.side(stationary, stationarySide) -
          CanvasBounds.side(snap.moving, movingSide),
      ),
    ),
  );
  const reachable = shifts.filter(
    (shift) => Math.abs(shift) <= SideSnap.ThresholdPx,
  );
  if (reachable.length === 0) {
    return 0;
  }
  return reachable.reduce((nearest, shift) =>
    Math.abs(shift) < Math.abs(nearest) ? shift : nearest,
  );
}

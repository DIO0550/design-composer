import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";

/**
 * Alt / Option の距離を測る相手（画面上の px）。
 *
 * kind が分けているのは何を測るか（親の中のノード / キャンバス上の artboard）で、
 * FacingDistances は相手の並びから線を引くだけでノードと artboard を区別しない。
 */
export type DistanceTargets =
  /**
   * ノード: 囲む親（運んでいる間は落とし先の親、リサイズ中は今の親）と、その直下の自分以外の子
   */
  | Readonly<{
      kind: "within-parent";
      parentBounds: CanvasBounds;
      siblings: readonly CanvasBounds[];
    }>
  /**
   * artboard: 描かれていて大きさを持つ他の artboard（リサイズ中は幅につられて動くものを除く。
   * `.dcmp` の並び順）
   */
  | Readonly<{ kind: "among-artboards"; others: readonly CanvasBounds[] }>;

export const DistanceTargets = {
  /**
   * 起点から、測る相手までの Alt / Option の距離を引く。
   *
   * @param targets 距離を測る相手
   * @param from 距離を測り始める矩形
   * @returns 向きごとの短い線
   */
  toDistances(targets: DistanceTargets, from: CanvasBounds): FacingDistances {
    switch (targets.kind) {
      case "within-parent":
        return FacingDistances.create({
          from,
          parentBounds: targets.parentBounds,
          siblings: targets.siblings,
        });
      case "among-artboards":
        return FacingDistances.createAmong({ from, others: targets.others });
    }
  },
} as const;

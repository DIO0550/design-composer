import type { ChildPosition } from "@/domains/dcmp/child-position";
import type { Offset } from "@/domains/unit/offset";
import { CanvasBounds } from "../canvas-bounds";
import type { DropParent } from "../drop-parent";

/**
 * 実測を通した `DropParent`。親と、その直下に並ぶ子が画面上のどこにあるかまで分かっている。
 *
 * `DropParent` と別の型にするのは、計測していない親を挿入位置の計算へ渡せなくするため
 * （rules/coding.md「処理の通過を型に刻む」）。
 */
export type DropZone = Readonly<{
  parent: DropParent;
  bounds: CanvasBounds;
  children: readonly CanvasBounds[];
}>;

/**
 * 落ちる位置と、それを画面で示すのに要る実測値。位置だけでは何も描けないため対で持つ。
 *
 * `childCount` と `parentBounds` を持つのは、落ちる先を「どの親の何個中どこか」として
 * 示すため（UI 案 docs/Design Composer.html の `into login-form · child 3 of 5`）。
 * 綴りは持たない — どう書くかは表示側の関心事（rules/architecture.md「出口も同じ」）。
 */
export type DropTarget = Readonly<{
  position: ChildPosition;
  marker: CanvasBounds;
  /** 落とす前にその親が持っている子の数。 */
  childCount: number;
  /** 落とし先の親の矩形。落ちる位置を示すラベルをこの端へ寄せる。 */
  parentBounds: CanvasBounds;
}>;

/** 挿入位置に引く線の太さ（px）。 */
const MarkerThicknessPx = 2;

/**
 * 挿入位置（線を引く座標）を、子が並ぶ向きの軸上で求める。
 * 端では隣の子がいないので親の内側の端へ寄せ、間では隣り合う子の隙間の中央へ置く。
 *
 * @param zone 親と子の矩形を持つ落とし先の帯
 * @param index 挿入したい位置（0 なら先頭、子の数と同じなら末尾）
 * @returns 子が並ぶ向きの軸上の座標
 */
function insertionCoordinate(zone: DropZone, index: number): number {
  const direction = zone.parent.direction;
  if (zone.children.length === 0) {
    return CanvasBounds.start(zone.bounds, direction);
  }
  if (index === 0) {
    return CanvasBounds.start(zone.children[0], direction);
  }
  const previousEnd = CanvasBounds.end(zone.children[index - 1], direction);
  if (index === zone.children.length) {
    return previousEnd;
  }
  return (
    (previousEnd + CanvasBounds.start(zone.children[index], direction)) / 2
  );
}

/**
 * 挿入位置を示す線。子が並ぶ向きと直交し、親の端から端まで伸びる。
 *
 * @param zone 親と子の矩形を持つ落とし先の帯
 * @param coordinate 線を引く軸上の座標
 * @returns 線として描く矩形
 */
function markerBounds(zone: DropZone, coordinate: number): CanvasBounds {
  const half = MarkerThicknessPx / 2;
  return zone.parent.direction === "row"
    ? {
        left: coordinate - half,
        top: zone.bounds.top,
        width: MarkerThicknessPx,
        height: zone.bounds.height,
      }
    : {
        left: zone.bounds.left,
        top: coordinate - half,
        width: zone.bounds.width,
        height: MarkerThicknessPx,
      };
}

export const DropZone = {
  /** 子の矩形はドキュメント上の並び順で受け取る（描かれる順序がそのまま子の順序）。 */
  create(
    parent: DropParent,
    bounds: CanvasBounds,
    children: readonly CanvasBounds[],
  ): DropZone {
    return { parent, bounds, children };
  },

  /**
   * ポインタの位置から「どの Box の何番目の子になるか」と、そこに引く線を決める。
   * index は「軸方向の中点をポインタが越えた子の数」で、子が無ければ 0 になる。
   */
  targetAt(zone: DropZone, pointer: Offset): DropTarget {
    const direction = zone.parent.direction;
    const along = direction === "row" ? pointer.x : pointer.y;
    const index = zone.children.filter(
      (child) => CanvasBounds.center(child, direction) < along,
    ).length;
    return {
      position: { parentName: zone.parent.name, index },
      marker: markerBounds(zone, insertionCoordinate(zone, index)),
      childCount: zone.children.length,
      parentBounds: zone.bounds,
    };
  },
} as const;

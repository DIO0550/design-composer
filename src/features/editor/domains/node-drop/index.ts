import { Artboard } from "@/domains/artboard";
import type { ChildPosition } from "@/domains/child-position";
import { BoxElement } from "@/domains/compiled-element";
import type { CssDirection } from "@/domains/css-direction";
import { DesignDocument } from "@/domains/design-document";
import { Node } from "@/domains/node";
import { NodeTree } from "@/domains/node-tree";
import { ResolvedProps } from "@/domains/resolved-props";
import type { CanvasOffset } from "@/features/editor/domains/canvas-view";
import { Option } from "@/utils/Option";

/**
 * ドロップ先の候補になれる親（docs/06-ui.md「キャンバス直接操作」の移動）。
 *
 * 向きを名前と対で持つのは、挿入位置がその向きの軸上でしか決まらないため
 * （どちらか片方だけでは「何番目の子になるか」を答えられない）。
 */
export type DropParent = Readonly<{
  name: string;
  direction: CssDirection;
}>;

/**
 * 画面上の矩形（client 座標・px）。
 *
 * 「何番目の子になるか」は実際に描かれた位置と大きさでしか決まらない
 * （レイアウトはブラウザが行う）ため、実測値をこの形でドメインへ渡す。
 */
export type CanvasBounds = Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>;

export const CanvasBounds = {
  /** 子が並ぶ向きに沿った始点。 */
  start(bounds: CanvasBounds, direction: CssDirection): number {
    return direction === "row" ? bounds.left : bounds.top;
  },

  /** 子が並ぶ向きに沿った終点。 */
  end(bounds: CanvasBounds, direction: CssDirection): number {
    return direction === "row"
      ? bounds.left + bounds.width
      : bounds.top + bounds.height;
  },

  /** 子が並ぶ向きに沿った中点。ポインタがここを越えたかで前後が決まる。 */
  center(bounds: CanvasBounds, direction: CssDirection): number {
    return (
      (CanvasBounds.start(bounds, direction) +
        CanvasBounds.end(bounds, direction)) /
      2
    );
  },
} as const;

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

/** 落ちる位置と、それを画面で示す線。位置だけでは何も描けないため対で持つ。 */
export type DropTarget = Readonly<{
  position: ChildPosition;
  marker: CanvasBounds;
}>;

/** 挿入位置に引く線の太さ（px）。 */
const MARKER_THICKNESS_PX = 2;

/** 子を持てるプリミティブは Box だけで、並ぶ向きはその `direction` prop で決まる（docs/03-schema.md）。 */
function dropParentOfNode(node: Node): Option<DropParent> {
  if (!Node.isPrimitive(node) || !NodeTree.allowsChildren(node)) {
    return Option.none;
  }
  return Option.some({
    name: node.name,
    direction: BoxElement.childDirection(
      ResolvedProps.resolve("Box", node.props ?? {}),
    ),
  });
}

/** artboard は常に子を持てる。並ぶ向きは Box として解決した props が持つ。 */
function dropParentOfArtboard(artboard: Artboard): DropParent {
  return {
    name: artboard.name,
    direction: BoxElement.childDirection(Artboard.boxProps(artboard)),
  };
}

function dropParentOf(
  document: DesignDocument,
  name: string,
): Option<DropParent> {
  const artboard = DesignDocument.findArtboard(document, name);
  if (artboard.some) {
    return Option.some(dropParentOfArtboard(artboard.value));
  }
  return Option.flatMap(
    DesignDocument.findNode(document, name),
    dropParentOfNode,
  );
}

export const DropParent = {
  /**
   * 内側から外へ並べた候補のうち、掴んでいるノードを受け入れられる最も内側のものを選ぶ。
   *
   * 受け入れられないのは次の3つで、いずれも候補から外して外側を見に行く。
   * - ドキュメントに無い名前（部品インスタンスの中身は定義側のノード名で描かれる）
   * - 子を持てないノード（Text・参照ノード）
   * - 掴んでいるノード自身とその子孫（入れるとツリーが壊れる。`DesignDocument.moveNode`
   *   も `move-into-descendant` として拒む）
   *
   * 掴んでいるノードの上を通ったときにその親が選ばれるのは、外へ辿った結果であって
   * 既定値へ倒しているわけではない（元の位置へ戻すのは正当な移動）。
   */
  innermost(
    document: DesignDocument,
    heldName: string,
    names: readonly string[],
  ): Option<DropParent> {
    const held = DesignDocument.findNode(document, heldName);
    if (!held.some) {
      return Option.none;
    }
    const heldSubtree = Node.collectNames(held.value);
    for (const name of names) {
      if (heldSubtree.includes(name)) {
        continue;
      }
      const parent = dropParentOf(document, name);
      if (parent.some) {
        return parent;
      }
    }
    return Option.none;
  },
} as const;

/**
 * 挿入位置（線を引く座標）を、子が並ぶ向きの軸上で求める。
 * 端では隣の子がいないので親の内側の端へ寄せ、間では隣り合う子の隙間の中央へ置く。
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

/** 挿入位置を示す線。子が並ぶ向きと直交し、親の端から端まで伸びる。 */
function markerBounds(zone: DropZone, coordinate: number): CanvasBounds {
  const half = MARKER_THICKNESS_PX / 2;
  return zone.parent.direction === "row"
    ? {
        left: coordinate - half,
        top: zone.bounds.top,
        width: MARKER_THICKNESS_PX,
        height: zone.bounds.height,
      }
    : {
        left: zone.bounds.left,
        top: coordinate - half,
        width: zone.bounds.width,
        height: MARKER_THICKNESS_PX,
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
  targetAt(zone: DropZone, pointer: CanvasOffset): DropTarget {
    const direction = zone.parent.direction;
    const along = direction === "row" ? pointer.x : pointer.y;
    const index = zone.children.filter(
      (child) => CanvasBounds.center(child, direction) < along,
    ).length;
    return {
      position: { parentName: zone.parent.name, index },
      marker: markerBounds(zone, insertionCoordinate(zone, index)),
    };
  },
} as const;

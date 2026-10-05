import type { ChildPosition } from "@/domains/dcmp/child-position";
import { CssDirection } from "@/domains/dcmp/css-direction";
import { Offset } from "@/domains/unit/offset";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { ArrayEx } from "@/utils/ArrayEx";
import { Range } from "@/utils/Range";
import type { InsertionParent } from "../drop-parent";

/**
 * 実測を通した `InsertionParent`。親と、その直下に並ぶ子が画面上のどこにあるかまで
 * 分かっている。
 *
 * **向きを持たない親**を渡せないことは `InsertionParent` 自身が受け持つので、この型が足す
 * のは計測の1段だけ。
 */
export type DropZone = Readonly<{
  parent: InsertionParent;
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

/** 親の子の並びで何番目かを付けた、子の矩形。 */
type IndexedBounds = Readonly<{
  bounds: CanvasBounds;
  /** 親の子の並びで何番目か */
  index: number;
}>;

/**
 * 親が子を並べる 1 本の行（CSS の flex line。縦並びなら 1 列）。並びの位置も線も、ポインタの
 * ある行の中で決める。
 */
type FlexLine = Readonly<{
  /**
   * 行に並ぶ子。ドキュメント上の並び順。折り返す親では面積の無い子（`display: none` で描か
   * れない非表示の子は実測が `0,0,0,0` になる）を含めず、行の先頭・末尾にも位置の比べ先にも
   * しない
   */
  children: readonly IndexedBounds[];
  /** 交差軸上でこの行が受け持つ範囲。ポインタがこの範囲にあればこの行へ落ち、線もこの長さで引く */
  crossRange: Range;
}>;

/**
 * 描かれている子を、折り返した行ごとに分ける。
 *
 * 交差軸で直前の子の終端以降から始まる子を次の行の先頭とする。同じ行の子は align の値に
 * よらず交差軸の範囲を共有するので、主軸の後戻りは見なくてよい。
 *
 * @param drawn 面積のある子。1 つ以上
 * @param direction 子が並ぶ向き
 * @returns 並び順の行ごとの子。どの行も 1 つ以上の子を持つ
 */
function splitIntoFlexLines(
  drawn: readonly IndexedBounds[],
  direction: CssDirection,
): readonly (readonly IndexedBounds[])[] {
  const crossExtents = drawn.map(({ bounds }, position) => ({
    position,
    extent: CanvasBounds.crossExtent(bounds, direction),
  }));
  const nextLineStarts = ArrayEx.adjacentPairs(crossExtents)
    .filter(({ previous, next }) => Range.follows(next.extent, previous.extent))
    .map(({ next }) => next.position);
  const starts = [0, ...nextLineStarts];
  return starts.map((start, line) => drawn.slice(start, starts[line + 1]));
}

/**
 * 行に並ぶ子が交差軸上で占める範囲。
 *
 * @param children 行の子。1 つ以上
 * @param direction 子が並ぶ向き
 * @returns 子の交差軸の範囲をすべて含む最小の範囲
 */
function occupiedCrossRange(
  children: readonly IndexedBounds[],
  direction: CssDirection,
): Range {
  return children
    .map(({ bounds }) => CanvasBounds.crossExtent(bounds, direction))
    .reduce((widest, range) => ({
      min: Math.min(widest.min, range.min),
      max: Math.max(widest.max, range.max),
    }));
}

/**
 * 親の子を行ごとの並びに分ける。
 *
 * 面積の無い子を外すのは折り返す親だけ。折り返さない親は行を見分ける必要が無く、子の並び
 * での数え方を今のまま保つ。
 *
 * @param zone 落とし先
 * @returns 並び順の行ごとの子。必ず 1 行以上。折り返さない親ではすべての子を持つ 1 行、
 *   折り返す親で描かれている子が無ければ子の無い 1 行
 */
function groupChildren(zone: DropZone): readonly (readonly IndexedBounds[])[] {
  const indexed = zone.children.map((bounds, index) => ({ bounds, index }));
  if (!zone.parent.wraps) {
    return [indexed];
  }
  const drawn = indexed.filter(({ bounds }) => CanvasBounds.hasArea(bounds));
  return drawn.length > 0
    ? splitIntoFlexLines(drawn, zone.parent.direction)
    : [drawn];
}

/**
 * 親の子を行に分け、各行が交差軸上で受け持つ範囲を決める。
 *
 * 隣り合う行の境目は、前の行の終端と次の行の始端の中央に置く。先頭の行は親の始端から、
 * 末尾の行は親の終端までを受け持つので、1 行なら親の端から端になる。
 *
 * @param zone 落とし先
 * @returns 並び順の行。必ず 1 行以上
 */
function flexLinesOf(zone: DropZone): readonly FlexLine[] {
  const direction = zone.parent.direction;
  const parentRange = CanvasBounds.crossExtent(zone.bounds, direction);
  const groups = groupChildren(zone);
  const boundaries = ArrayEx.adjacentPairs(groups).map(({ previous, next }) =>
    Range.center({
      min: occupiedCrossRange(previous, direction).max,
      max: occupiedCrossRange(next, direction).min,
    }),
  );
  const edges = [parentRange.min, ...boundaries, parentRange.max];
  return groups.map((children, line) => ({
    children,
    crossRange: { min: edges[line], max: edges[line + 1] },
  }));
}

/**
 * 行の中で挿入したい位置を、親の子の並びでの番号に直す。
 *
 * @param flexLine 挿入する行
 * @param indexInLine 行の中で挿入したい位置（0 なら行の先頭、行の子の数と同じなら行の末尾）
 * @returns 行の中のその位置の次にある子の番号。行の末尾なら行の最後の子の直後。
 *   行に子が無ければ 0
 */
function childIndexOf(flexLine: FlexLine, indexInLine: number): number {
  const children = flexLine.children;
  if (children.length === 0) {
    return 0;
  }
  return indexInLine < children.length
    ? children[indexInLine].index
    : children[children.length - 1].index + 1;
}

/**
 * 挿入位置（線を引く座標）を、子が並ぶ向きの軸上で求める。
 * 行の端では隣の子がいないので端の子の外側へ寄せ、間では隣り合う子の隙間の中央へ置く。
 * 行に子が無ければ親の内側の端へ寄せる。
 *
 * @param zone 落とし先
 * @param flexLine 挿入する行
 * @param indexInLine 行の中で挿入したい位置（0 なら行の先頭、行の子の数と同じなら行の末尾）
 * @returns 子が並ぶ向きの軸上の座標
 */
function insertionCoordinate(
  zone: DropZone,
  flexLine: FlexLine,
  indexInLine: number,
): number {
  const direction = zone.parent.direction;
  const children = flexLine.children.map(({ bounds }) => bounds);
  if (children.length === 0) {
    return CanvasBounds.start(zone.bounds, direction);
  }
  if (indexInLine === 0) {
    return CanvasBounds.start(children[0], direction);
  }
  const previousEnd = CanvasBounds.end(children[indexInLine - 1], direction);
  if (indexInLine === children.length) {
    return previousEnd;
  }
  return (
    (previousEnd + CanvasBounds.start(children[indexInLine], direction)) / 2
  );
}

/**
 * 挿入位置を示す線。子が並ぶ向きと直交し、行が受け持つ範囲の端から端まで伸びる
 * （折り返していなければ親の端から端）。
 *
 * @param zone 落とし先
 * @param flexLine 線を引く行
 * @param coordinate 線を引く主軸上の座標
 * @returns 線として描く矩形
 */
function markerBounds(
  zone: DropZone,
  flexLine: FlexLine,
  coordinate: number,
): CanvasBounds {
  const half = MarkerThicknessPx / 2;
  const range = flexLine.crossRange;
  return zone.parent.direction === "row"
    ? {
        left: coordinate - half,
        top: range.min,
        width: MarkerThicknessPx,
        height: Range.length(range),
      }
    : {
        left: range.min,
        top: coordinate - half,
        width: Range.length(range),
        height: MarkerThicknessPx,
      };
}

export const DropZone = {
  /**
   * 実測した親と子の矩形から落とし先を作る。
   *
   * @param parent 子を受け入れる親
   * @param bounds 親の矩形
   * @param children 直下の子の矩形。ドキュメント上の並び順（描かれる順序がそのまま子の順序）
   * @returns 渡した矩形をそのまま持つ落とし先
   */
  create(
    parent: InsertionParent,
    bounds: CanvasBounds,
    children: readonly CanvasBounds[],
  ): DropZone {
    return { parent, bounds, children };
  },

  /**
   * ポインタの位置から「どの Box の何番目の子になるか」と、そこに引く線を決める。
   * 交差軸で行の境目をポインタが越えた数で行を選び、その行の中で軸方向の中点をポインタが
   * 越えた子の次に挿さる。折り返していなければ行は 1 つで、行に子が無ければ 0 になる。
   *
   * @param zone 落とし先
   * @param pointer 画面上のポインタの位置
   * @returns 挿さる位置と、線・ラベルを描くのに要る実測値
   */
  targetAt(zone: DropZone, pointer: Offset): DropTarget {
    const direction = zone.parent.direction;
    const along = Offset.along(pointer, CssDirection.mainAxis(direction));
    const across = Offset.along(pointer, CssDirection.crossAxis(direction));
    const flexLines = flexLinesOf(zone);
    const crossedBoundaries = flexLines
      .slice(1)
      .filter((next) => next.crossRange.min < across).length;
    const flexLine = flexLines[crossedBoundaries];
    const indexInLine = flexLine.children.filter(
      ({ bounds }) => CanvasBounds.center(bounds, direction) < along,
    ).length;
    return {
      position: {
        parentName: zone.parent.name,
        index: childIndexOf(flexLine, indexInLine),
      },
      marker: markerBounds(
        zone,
        flexLine,
        insertionCoordinate(zone, flexLine, indexInLine),
      ),
      childCount: zone.children.length,
      parentBounds: zone.bounds,
    };
  },
} as const;

import type { Offset } from "@/domains/unit/offset";
import { SidePair, SidePairs } from "@/domains/unit/side";
import { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { Option } from "@/utils/Option";

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

/**
 * 揃った辺に引くガイド線として描く矩形（画面上の px）。
 *
 * キーは**揃った辺の組**で、線の向きとは直交する（`horizontal` は左右の辺が揃った
 * ことを指すので、線そのものは**縦**に伸びる）。
 *
 * 並びではなく組で持つのは、寄る先が軸ごとに 1 つに決まる（同じ距離なら先に見つけた
 * ほうへ寄る）ため。並びにすると「同じ軸に 2 本」が型で書けてしまう。
 */
export type SnapGuides = Readonly<Record<SidePair, Option<CanvasBounds>>>;

/**
 * 辺のスナップ 1 回分の答え（docs/06-ui.md「キャンバス直接操作」の辺のスナップ）。
 *
 * 寄せ量とガイド線を 1 つの型で返すのは、どちらも**同じ 1 回の総当たり**が決めるため。
 * 別々の入口にすると、寄る先とガイド線が別々に決まる余地が残る。
 */
export type SideSnapped = Readonly<{
  /** 寄せ量（画面上の px）。揃う辺が無ければ縦横とも 0 */
  offset: Offset;
  guides: SnapGuides;
}>;

/**
 * ガイド線の太さ（px）。
 *
 * 挿入位置に引く線（`DropZone` の `MarkerThicknessPx`）と同じ太さ・同じ中心合わせにして、
 * キャンバスに出る線の流儀を割らない。2 つは排他（ツリーへの挿入と座標の置き直しは
 * 同時に起きない）なので、太さが同じでも混ざらない。
 *
 * Why not（`DropZone` と 1 つにまとめない）: あちらは線の向きを `CssDirection`（子が
 * 並ぶ向き）で、こちらは `SidePair`（揃った辺の組）で決めており、まとめると片方に
 * もう片方の語彙が入る。**揃えているのは値ではなく見せ方の約束**なので、拠り所は
 * docs/06-ui.md 側に置いてある（片方だけ変えてもここは落ちない）。
 */
const GuideThicknessPx = 2;

/**
 * ある向きで揃った辺 1 つ分。
 *
 * 揃え先の矩形まで持つのは、ガイド線の長さが**揃った 2 つの矩形**で決まるため
 * （揃え先の辺の座標だけでは、どこからどこまで引くかが決まらない）。
 */
type SnappedSide = Readonly<{
  pair: SidePair;
  /** 寄せ量（画面上の px）。既に揃っていれば 0 */
  shift: number;
  /** 揃え先の辺の座標（ガイド線を引く位置） */
  stationarySide: number;
  /** 揃え先の矩形 */
  stationary: CanvasBounds;
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
   * 揃う位置へ寄せる量と、揃った辺に引くガイド線。
   *
   * ガイド線を**寄せたあとの矩形**から組み立てるのは、片方の軸で寄ると線の長さを決める
   * 端も動くため。寄せる前の位置で組み立てると、線が寄せ量のぶんだけ短く / 長く出る。
   *
   * @param snap 判定する組
   * @returns 寄せ量と、揃った辺に引く線（閾値に届く辺の組が無ければ寄せ量は縦横とも 0・線は無し）
   */
  toSnapped(snap: SideSnap): SideSnapped {
    const horizontal = nearestAlong(snap, SidePairs.Horizontal);
    const vertical = nearestAlong(snap, SidePairs.Vertical);
    const offset = { x: shiftOf(horizontal), y: shiftOf(vertical) };
    const moved = CanvasBounds.movedBy(snap.moving, offset);
    return {
      offset,
      guides: {
        horizontal: Option.map(horizontal, (side) => guideBounds(side, moved)),
        vertical: Option.map(vertical, (side) => guideBounds(side, moved)),
      },
    };
  },
} as const;

/**
 * その向きの寄せ量。
 *
 * @param snapped その向きで揃った辺
 * @returns 寄せ量（画面上の px）。揃う辺が無ければ 0
 */
function shiftOf(snapped: Option<SnappedSide>): number {
  return snapped.some ? snapped.value.shift : 0;
}

/**
 * 向かい合う 2 辺の組ごとに、いちばん近い揃い。
 *
 * 運んでいるものの 2 辺と、揃え先それぞれの 2 辺を総当たりで比べ、閾値に届くうち
 * **いちばん近い組**を採る。同じ距離の組が 2 つあるときは先に見つけたほう
 * （＝揃え先の並び順）を採る。
 *
 * @param snap 判定する組
 * @param pair 見る 2 辺の組（水平なら左右＝x、垂直なら上下＝y）
 * @returns その向きで揃った辺。閾値に届く組が無ければ `none`
 */
function nearestAlong(snap: SideSnap, pair: SidePair): Option<SnappedSide> {
  const sides = SidePair.sides(pair);
  const candidates = snap.stationary.flatMap((stationary) =>
    sides.flatMap((stationarySide) =>
      sides.map((movingSide) => ({
        pair,
        shift:
          CanvasBounds.side(stationary, stationarySide) -
          CanvasBounds.side(snap.moving, movingSide),
        stationarySide: CanvasBounds.side(stationary, stationarySide),
        stationary,
      })),
    ),
  );
  const reachable = candidates.filter(
    (candidate) => Math.abs(candidate.shift) <= SideSnap.ThresholdPx,
  );
  if (reachable.length === 0) {
    return Option.none;
  }
  return Option.some(
    reachable.reduce((nearest, candidate) =>
      Math.abs(candidate.shift) < Math.abs(nearest.shift) ? candidate : nearest,
    ),
  );
}

/**
 * 揃った辺に引くガイド線を、描く矩形として組み立てる。
 *
 * 線は揃った辺と同じ向きに伸び、**寄せたあとの運んでいるものと揃え先の両方をまたぐ**
 * 長さで引く（またがないと、何に揃ったのかが見えない）。太さのぶんは中心を辺の座標に
 * 合わせて振り分ける（`DropZone` の挿入線と同じ）。
 *
 * @param snapped 揃った辺
 * @param moved 寄せたあとの運んでいるものの矩形
 * @returns 線として描く矩形（画面上の px）
 */
function guideBounds(snapped: SnappedSide, moved: CanvasBounds): CanvasBounds {
  const across = SidePair.sides(SidePair.perpendicular(snapped.pair));
  const ends = [moved, snapped.stationary].flatMap((bounds) =>
    across.map((side) => CanvasBounds.side(bounds, side)),
  );
  const from = Math.min(...ends);
  const length = Math.max(...ends) - from;
  const half = GuideThicknessPx / 2;
  return snapped.pair === SidePairs.Horizontal
    ? {
        left: snapped.stationarySide - half,
        top: from,
        width: GuideThicknessPx,
        height: length,
      }
    : {
        left: from,
        top: snapped.stationarySide - half,
        width: length,
        height: GuideThicknessPx,
      };
}

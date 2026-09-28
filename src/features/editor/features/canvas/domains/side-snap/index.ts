import { type Axis, type AxisEnd, AxisEnds } from "@/domains/unit/axis";
import type { Offset } from "@/domains/unit/offset";
import { SidePair, SidePairs } from "@/domains/unit/side";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { Option } from "@/utils/Option";

/**
 * 辺のスナップ 1 回分（運んでいる / 伸び縮みさせているものの行き先と、揃え先の並び /
 * すべて画面上の px / docs/06-ui.md「キャンバス直接操作」）。運ぶときに揃えるのは辺どうしと
 * 中心線どうし、伸び縮みさせるとき（`toEdgeShift`）は掴んだ辺と揃え先の辺だけ。
 *
 * 寄せ量は**運んでいるものの行き先と、揃え先の並びの両方**で決まり片方だけでは答えが出
 * ないので、対を表す型にして判定をそこへ帰属させる（rules/architecture.md「2つの値が常
 * に対で意味を持つなら対を表す型を作る」）。
 */
export type SideSnap = Readonly<{
  moving: CanvasBounds;
  stationary: readonly CanvasBounds[];
}>;

/**
 * 揃った線（辺か中心線）に引くガイド線として描く矩形（画面上の px）。
 *
 * キーは**揃った線を挟む辺の組**で、線の向きとは直交する（`horizontal` は左右の辺か
 * 左右の中心線が揃ったことを指すので、線そのものは**縦**に伸びる）。
 *
 * 並びにすると「同じ軸に 2 本」が型で書けてしまう。
 */
export type SnapGuides = Readonly<Record<SidePair, Option<CanvasBounds>>>;

/**
 * 辺のスナップ 1 回分の答え（docs/06-ui.md「キャンバス直接操作」の辺のスナップ。中心線を含む）。
 *
 * 別々の入口にすると、寄る先とガイド線が別々に決まる余地が残る。
 */
export type SideSnapped = Readonly<{
  /** 寄せ量（画面上の px）。揃う線が無ければ縦横とも 0 */
  offset: Offset;
  guides: SnapGuides;
}>;

/**
 * ガイド線の太さ（px）。
 *
 * 挿入位置に引く線（`DropZone` の `MarkerThicknessPx`）と同じ太さ・同じ中心合わせにして、
 * キャンバスに出る線の流儀を割らない（2 つは排他なので、太さが同じでも混ざらない）。
 *
 * **揃えているのは値ではなく見せ方の約束**なので、拠り所は docs/06-ui.md 側に置いてある
 * （片方だけ変えてもここは落ちない）。
 */
const GuideThicknessPx = 2;

/**
 * ある向きで揃った線（辺か中心線）1 つ分。
 */
type SnappedLine = Readonly<{
  pair: SidePair;
  /** 寄せ量（画面上の px）。既に揃っていれば 0 */
  shift: number;
  /** 揃え先の辺か中心線の座標（ガイド線を引く位置） */
  stationaryLine: number;
  /** 揃え先の矩形 */
  stationary: CanvasBounds;
}>;

export const SideSnap = {
  /**
   * 揃うとみなす距離（**画面上の px**）。
   *
   * 倍率を変えても吸い付く手応えが変わらないようにするため画面上の px で持つ（ドキュメ
   * ント上の px だと、拡大するほど広い範囲で吸い付いて狙った位置へ置けない）。
   */
  ThresholdPx: 6,

  /**
   * 判定する組を作る。
   *
   * @param moving 運んでいる / 伸び縮みさせているものの行き先の矩形
   * @param stationary 揃える先の矩形の並び（近さが同じときは先にあるほうへ寄る）
   * @returns 揃えの判定に使う組
   */
  create(moving: CanvasBounds, stationary: readonly CanvasBounds[]): SideSnap {
    return { moving, stationary };
  },

  /**
   * 揃う位置へ寄せる量と、揃った線（辺か中心線）に引くガイド線。
   *
   * 寄せる前の位置で組み立てると、線が寄せ量のぶんだけ短く / 長く出る。
   *
   * @param snap 判定する組
   * @returns 寄せ量と、揃った線に引くガイド線（閾値に届く組が無ければ寄せ量は縦横とも 0・線は無し）
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

  /**
   * 辺 1 本だけを、揃え先の同じ向きの辺へ寄せる量（docs/06-ui.md「リサイズハンドル」の
   * 辺のスナップ）。リサイズでは掴んだ辺しか動かないので、他の辺と中心線は見ない。
   *
   * 揃え先の中心線とも組にしない（中心線と辺は組にしない、は移動と同じ）。
   *
   * @param snap 判定する組。`moving` は掴んだ辺が行き先にある矩形
   * @param axis 掴んだ辺の軸
   * @param end 掴んだ辺がその軸のどちらの端か
   * @returns 寄せ量（画面上の px）。閾値に届く辺が無ければ 0
   */
  toEdgeShift(snap: SideSnap, axis: Axis, end: AxisEnd): number {
    const movingLine = CanvasBounds.edgeAt(snap.moving, axis, end);
    const shifts = snap.stationary.flatMap((stationary) =>
      Object.values(AxisEnds).map((stationaryEnd) => ({
        shift:
          CanvasBounds.edgeAt(stationary, axis, stationaryEnd) - movingLine,
      })),
    );
    return shiftOf(nearestReachable(shifts));
  },
} as const;

/**
 * 揃った候補の寄せ量。
 *
 * @param snapped 揃った線（辺か中心線）か辺
 * @returns 寄せ量（画面上の px）。揃うものが無ければ 0
 */
function shiftOf(snapped: Option<Readonly<{ shift: number }>>): number {
  return Option.isSome(snapped) ? snapped.value.shift : 0;
}

/**
 * 向かい合う 2 辺の組ごとに、いちばん近い揃い。
 *
 * 揃え先ごとに、運んでいるものと揃え先の**辺どうしの 4 組**と**中心線どうしの 1 組**を
 * 並べ（`candidatesAgainst`）、その中からいちばん近い組を採る（`nearestReachable`）。
 * 中心線と辺は組にしない。
 *
 * @param snap 判定する組
 * @param pair 見る 2 辺の組（水平なら左右＝x、垂直なら上下＝y）
 * @returns その向きで揃った線。閾値に届く組が無ければ `none`
 */
function nearestAlong(snap: SideSnap, pair: SidePair): Option<SnappedLine> {
  return nearestReachable(
    snap.stationary.flatMap((stationary) =>
      candidatesAgainst(snap.moving, { stationary, pair }),
    ),
  );
}

/**
 * 閾値に届く候補のうち、寄せ量がいちばん小さいもの。同じ距離の候補が 2 つあるときは先に
 * 並んだほうを採る（揃え先の並び順。揃え先の中の順は候補を並べる側が決める）。
 *
 * @param candidates 揃えたときの寄せ量を持つ候補の並び（閾値で絞る前）
 * @returns いちばん近い候補。閾値に届く候補が無ければ `none`
 */
function nearestReachable<T extends Readonly<{ shift: number }>>(
  candidates: readonly T[],
): Option<T> {
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
 * 揃え先 1 つに対して、ある向きで揃えうる組をすべて並べる。
 *
 * 並びは辺どうしの 4 組のあとに中心線どうしの 1 組。`nearestReachable` は同じ距離なら先に
 * 並んだほうを採るので、この順が「同じ揃え先の中では辺を中心線より先に見る」になる。
 *
 * @param moving 運んでいるものの行き先の矩形
 * @param against 揃え先の矩形と、見る 2 辺の組
 * @returns 揃えたときの寄せ量と揃え先の線の座標の並び（閾値で絞る前）
 */
function candidatesAgainst(
  moving: CanvasBounds,
  against: Readonly<{ stationary: CanvasBounds; pair: SidePair }>,
): readonly SnappedLine[] {
  const { stationary, pair } = against;
  const sides = SidePair.sides(pair);
  const sidePairings = sides.flatMap((stationarySide) =>
    sides.map((movingSide) => ({
      stationaryLine: CanvasBounds.side(stationary, stationarySide),
      movingLine: CanvasBounds.side(moving, movingSide),
    })),
  );
  const midlinePairing = {
    stationaryLine: CanvasBounds.midline(stationary, pair),
    movingLine: CanvasBounds.midline(moving, pair),
  };
  const pairings = [...sidePairings, midlinePairing];
  return pairings.map(({ stationaryLine, movingLine }) => ({
    pair,
    shift: stationaryLine - movingLine,
    stationaryLine,
    stationary,
  }));
}

/**
 * 揃った線（辺か中心線）に引くガイド線を、描く矩形として組み立てる。
 *
 * 線は揃った辺・中心線と同じ向きに伸び、**寄せたあとの運んでいるものと揃え先の両方をまたぐ**
 * 長さで引く（またがないと、何に揃ったのかが見えない）。太さのぶんは線の中心を揃った
 * 座標に合わせて振り分ける（`DropZone` の挿入線と同じ）。
 *
 * @param snapped 揃った線
 * @param moved 寄せたあとの運んでいるものの矩形
 * @returns 線として描く矩形（画面上の px）
 */
function guideBounds(snapped: SnappedLine, moved: CanvasBounds): CanvasBounds {
  const across = SidePair.sides(SidePair.perpendicular(snapped.pair));
  const ends = [moved, snapped.stationary].flatMap((bounds) =>
    across.map((side) => CanvasBounds.side(bounds, side)),
  );
  const from = Math.min(...ends);
  const length = Math.max(...ends) - from;
  const half = GuideThicknessPx / 2;
  return snapped.pair === SidePairs.Horizontal
    ? {
        left: snapped.stationaryLine - half,
        top: from,
        width: GuideThicknessPx,
        height: length,
      }
    : {
        left: from,
        top: snapped.stationaryLine - half,
        width: length,
        height: GuideThicknessPx,
      };
}

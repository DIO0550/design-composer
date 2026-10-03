import { type Axis, type AxisEnd, AxisEnds } from "@/domains/unit/axis";
import type { Offset } from "@/domains/unit/offset";
import { SidePair, SidePairs } from "@/domains/unit/side";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { IntervalSlot } from "@/features/editor/features/canvas/domains/interval-slot";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";
import { Range } from "@/utils/Range";

/**
 * 辺のスナップ 1 回分（運んでいる / 伸び縮みさせているものの行き先と、揃え先の並び /
 * すべて画面上の px / docs/06-ui.md「キャンバス直接操作」）。運ぶときに揃えるのは辺どうしと
 * 中心線どうしと兄弟の列の間隔、伸び縮みさせるとき（`toEdgeShift`）は掴んだ辺と揃え先の辺だけ。
 *
 * 寄せ量は**運んでいるものの行き先と、揃え先の並びの両方**で決まり片方だけでは答えが出
 * ないので、対を表す型にして判定をそこへ帰属させる（rules/architecture.md「2つの値が常
 * に対で意味を持つなら対を表す型を作る」）。
 */
export type SideSnap = Readonly<{
  moving: CanvasBounds;
  /** 辺と中心線だけを揃える先。`siblings` に入れたものはここに重ねない */
  stationary: readonly CanvasBounds[];
  /**
   * 辺と中心線に加えて、兄弟の列の間隔も測る先。辺と中心線は `stationary` の後ろに並べて
   * 見る。間隔を測るかどうかはここに入れるかで決まり、辺だけを揃える呼び出し側は兄弟を
   * `stationary` に入れてよい。
   */
  siblings: readonly CanvasBounds[];
}>;

/**
 * 揃った線 1 つ分のスマートガイド。揃った線（辺か中心線）に引くガイド線と、揃え先との
 * 隙間に引く短い線（docs/06-ui.md「キャンバス直接操作」の辺のスナップ。どちらも描く矩形・
 * 画面上の px）。
 *
 * 隙間を軸ごとの別の並びで持つと、線の無い軸に隙間がある状態が書けてしまう。
 */
export type SnapGuide = Readonly<{
  guideLine: CanvasBounds;
  /** 揃え先との隙間に引く短い線。揃え先と重なっている / 接しているなら `none` */
  gapLine: Option<CanvasBounds>;
}>;

/**
 * 軸ごとの揃いの表示（揃った線と、揃え先との隙間）。
 *
 * キーは**揃った線を挟む辺の組**で、線の向きとは直交する（`horizontal` は左右の辺か
 * 左右の中心線が揃ったことを指すので、線そのものは**縦**に伸び、隙間は縦に測る）。
 *
 * 並びにすると「同じ軸に 2 本」が型で書けてしまう。
 */
export type SnapGuides = Readonly<Record<SidePair, Option<SnapGuide>>>;

/**
 * 揃え先との隙間の見せ方。隙間に引く短い線と、その中点に出す数値。
 *
 * 単位が 1 つだけ違う: `gapLine` は描く矩形なので**画面上の px**、`length` は人に見せる値なので
 * **ドキュメント上の px**（最も近い整数・1 以上）。
 */
export type GapReadout = Readonly<{
  gapLine: CanvasBounds;
  length: number;
}>;

/**
 * 辺のスナップ 1 回分の答え（docs/06-ui.md「キャンバス直接操作」の辺のスナップ。中心線を含む）。
 *
 * 別々の入口にすると、寄る先とガイド線が別々に決まる余地が残る。
 */
export type SideSnapped = Readonly<{
  /** 寄せ量（画面上の px）。揃う線も同じ間隔になる位置も無い軸は 0 */
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
  kind: "line";
  pair: SidePair;
  /** 寄せ量（画面上の px）。既に揃っていれば 0 */
  shift: number;
  /** 揃え先の辺か中心線の座標（ガイド線を引く位置） */
  stationaryLine: number;
  /** 揃え先の矩形 */
  stationary: CanvasBounds;
}>;

/**
 * ある向きで寄せる先の候補 1 つ分。揃った線（辺か中心線）か、兄弟の列と同じ間隔になる位置。
 *
 * 同じ間隔になる位置には揃え先の線が無いので、`SnappedLine` に詰めるとガイド線を引く位置を
 * 偽って埋めることになる。
 */
type SnapCandidate =
  | SnappedLine
  | Readonly<{
      kind: "interval";
      /** 寄せ量（画面上の px） */
      shift: number;
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
   * 判定する組を作る。列の間隔を測る兄弟は持たない（`withSiblings` で足す）。
   *
   * @param moving 運んでいる / 伸び縮みさせているものの行き先の矩形
   * @param stationary 揃える先の矩形の並び（近さが同じときは先にあるほうへ寄る）
   * @returns 揃えの判定に使う組
   */
  create(moving: CanvasBounds, stationary: readonly CanvasBounds[]): SideSnap {
    return { moving, stationary, siblings: [] };
  },

  /**
   * 列の間隔も測る兄弟を持たせた組。
   *
   * @param snap 判定する組
   * @param siblings 辺と中心線に加えて列の間隔も測る兄弟の矩形の並び（`stationary` に含めない）
   * @returns 兄弟を差し替えた組
   */
  withSiblings(snap: SideSnap, siblings: readonly CanvasBounds[]): SideSnap {
    return { ...snap, siblings };
  },

  /**
   * 揃う位置か兄弟の列と同じ間隔になる位置へ寄せる量と、揃った線（辺か中心線）に引く
   * ガイド線。
   *
   * 寄せる前の位置で組み立てると、線が寄せ量のぶんだけ短く / 長く出る。
   *
   * @param snap 判定する組
   * @returns 寄せ量と、揃った線に引くガイド線・揃え先との隙間（閾値に届く候補が無い軸は
   *   寄せ量 0・線も隙間も無し。同じ間隔になる位置へ寄った軸も線と隙間は無し）
   */
  toSnapped(snap: SideSnap): SideSnapped {
    const horizontal = nearestAlong(snap, SidePairs.Horizontal);
    const vertical = nearestAlong(snap, SidePairs.Vertical);
    const offset = { x: shiftOf(horizontal), y: shiftOf(vertical) };
    const moved = CanvasBounds.movedBy(snap.moving, offset);
    return {
      offset,
      guides: {
        horizontal: Option.flatMap(horizontal, (candidate) =>
          guideOf(candidate, moved),
        ),
        vertical: Option.flatMap(vertical, (candidate) =>
          guideOf(candidate, moved),
        ),
      },
    };
  },

  /**
   * ある軸の揃え先との隙間を、見せる数値と一緒に引く（docs/06-ui.md の辺のスナップ）。
   *
   * 引くキーと測る向きを同じ `pair` から取る。キーと向きを別々に渡す形にすると、取り違えた
   * ときに線の太さが隙間の数値として出る。
   *
   * @param guides 軸ごとのスマートガイド
   * @param pair 見る軸（揃った線を挟む辺の組）
   * @param view 割り戻しに使う倍率を持つ表示
   * @returns 隙間の短い線と数値。その軸に揃った線が無い / 揃え先と重なっている・接している /
   *   ドキュメント上の px へ丸めると 0 になるなら `none`
   */
  toGapReadout(
    guides: SnapGuides,
    pair: SidePair,
    view: CanvasView,
  ): Option<GapReadout> {
    return Option.flatMap(guides[pair], (guide) =>
      Option.flatMap(guide.gapLine, (gapLine) => {
        const length = CanvasView.toRoundedDocumentLength(
          view,
          Range.length(
            CanvasBounds.extentAlong(gapLine, SidePair.perpendicular(pair)),
          ),
        );
        return length > 0 ? Option.some({ gapLine, length }) : Option.none;
      }),
    );
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
    const shifts = lineTargets(snap).flatMap((stationary) =>
      Object.values(AxisEnds).map((stationaryEnd) => ({
        shift:
          CanvasBounds.edgeAt(stationary, axis, stationaryEnd) - movingLine,
      })),
    );
    return shiftOf(nearestReachable(shifts));
  },
} as const;

/**
 * 採った候補の寄せ量。
 *
 * @param snapped 揃った線（辺か中心線）・辺・列と同じ間隔になる位置のどれか
 * @returns 寄せ量（画面上の px）。寄せ先が無ければ 0
 */
function shiftOf(snapped: Option<Readonly<{ shift: number }>>): number {
  return Option.isSome(snapped) ? snapped.value.shift : 0;
}

/**
 * 辺と中心線を揃える先の並び。親 → 子の並び順になるよう、`stationary` を兄弟より先に置く。
 *
 * @param snap 判定する組
 * @returns 辺と中心線を見る揃え先の矩形の並び
 */
function lineTargets(snap: SideSnap): readonly CanvasBounds[] {
  return [...snap.stationary, ...snap.siblings];
}

/**
 * 向かい合う 2 辺の組ごとに、いちばん近い寄せ先。
 *
 * 揃え先ごとに、運んでいるものと揃え先の**辺どうしの 4 組**と**中心線どうしの 1 組**を
 * 並べ（`candidatesAgainst`）、その後ろに兄弟の列と同じ間隔になる位置を並べて、いちばん
 * 近いものを採る（`nearestReachable`）。中心線と辺は組にしない。
 *
 * 揃った線を先に並べるのは、同じ距離なら列の間隔より辺と中心線へ寄せるため。
 *
 * @param snap 判定する組
 * @param pair 見る 2 辺の組（水平なら左右＝x、垂直なら上下＝y）
 * @returns その向きの寄せ先。閾値に届く候補が無ければ `none`
 */
function nearestAlong(snap: SideSnap, pair: SidePair): Option<SnapCandidate> {
  const lines = lineTargets(snap).flatMap((stationary) =>
    candidatesAgainst(snap.moving, { stationary, pair }),
  );
  const intervals = IntervalSlot.collect(snap.siblings, pair).flatMap(
    (slot) => {
      const shift = IntervalSlot.toShift(slot, snap.moving);
      return Option.isSome(shift)
        ? [{ kind: "interval" as const, shift: shift.value }]
        : [];
    },
  );
  const candidates: readonly SnapCandidate[] = [...lines, ...intervals];
  return nearestReachable(candidates);
}

/**
 * 閾値に届く候補のうち、寄せ量がいちばん小さいもの。同じ距離の候補が 2 つあるときは先に
 * 並んだほうを採る（どの順に並べるかは候補を並べる側が決める）。
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
  return ArrayEx.minBy(reachable, (candidate) => Math.abs(candidate.shift));
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
    kind: "line",
    pair,
    shift: stationaryLine - movingLine,
    stationaryLine,
    stationary,
  }));
}

/**
 * 寄せ先に出すスマートガイド。揃った線（辺か中心線）にだけ出す。
 *
 * @param candidate 寄せ先
 * @param moved 寄せたあとの運んでいるものの矩形
 * @returns ガイド線と揃え先との隙間（画面上の px）。列の間隔へ寄ったなら `none`
 */
function guideOf(
  candidate: SnapCandidate,
  moved: CanvasBounds,
): Option<SnapGuide> {
  switch (candidate.kind) {
    case "line":
      return Option.some({
        guideLine: guideBounds(candidate, moved),
        gapLine: gapBounds(candidate, moved),
      });
    case "interval":
      return Option.none;
  }
}

/**
 * 揃った線（辺か中心線）に引くガイド線を、描く矩形として組み立てる。
 *
 * 線は揃った辺・中心線と同じ向きに伸び、**寄せたあとの運んでいるものと揃え先の両方をまたぐ**
 * 長さで引く（またがないと、何に揃ったのかが見えない）。
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
  return thinLineBounds(snapped.pair, {
    at: snapped.stationaryLine,
    span: { min: Math.min(...ends), max: Math.max(...ends) },
  });
}

/**
 * 揃え先との隙間に引く短い線を、描く矩形として組み立てる（置き方は docs/06-ui.md）。
 *
 * @param snapped 揃った線
 * @param moved 寄せたあとの運んでいるものの矩形
 * @returns 短い線として描く矩形（画面上の px）。ガイド線に沿った向きで重なっている /
 *   接しているなら `none`
 */
function gapBounds(
  snapped: SnappedLine,
  moved: CanvasBounds,
): Option<CanvasBounds> {
  const along = SidePair.perpendicular(snapped.pair);
  const gap = Range.gapBetween(
    CanvasBounds.extentAlong(moved, along),
    CanvasBounds.extentAlong(snapped.stationary, along),
  );
  return Option.map(gap, (span) =>
    thinLineBounds(snapped.pair, {
      at: facingCenter(moved, snapped),
      span,
    }),
  );
}

/**
 * 運んでいるものと揃え先が、揃った線と直交する向きで向かい合う範囲の中央。
 *
 * 重なりの有無は判定しない。外側で辺が揃ったときの重なりは 1 点で、
 * 寄せたあとの辺は浮動小数の足し引きで作るため、倍率や実測の端数で 1 点が数 ULP 離れて
 * 「重ならない」と判定され、隙間が黙って消える。
 *
 * @param moved 寄せたあとの運んでいるものの矩形
 * @param snapped 揃った線と揃え先
 * @returns 内側の 2 つの端の真ん中の座標（画面上の px）
 */
function facingCenter(moved: CanvasBounds, snapped: SnappedLine): number {
  const movedExtent = CanvasBounds.extentAlong(moved, snapped.pair);
  const stationaryExtent = CanvasBounds.extentAlong(
    snapped.stationary,
    snapped.pair,
  );
  return Range.center({
    min: Math.max(movedExtent.min, stationaryExtent.min),
    max: Math.min(movedExtent.max, stationaryExtent.max),
  });
}

/**
 * 揃った組の向きに伸びる細い線（ガイド線・隙間の短い線）を、描く矩形として組み立てる。
 * 太さのぶんは線の中心を `at` に合わせて振り分ける（`DropZone` の挿入線と同じ）。
 *
 * @param pair 揃った線を挟む辺の組（水平の組なら縦に伸びる線になる）
 * @param line 線の中心の座標と、線が伸びる範囲（どちらも画面上の px）
 * @returns 線として描く矩形（画面上の px）
 */
function thinLineBounds(
  pair: SidePair,
  line: Readonly<{ at: number; span: Range }>,
): CanvasBounds {
  const start = line.at - GuideThicknessPx / 2;
  const length = Range.length(line.span);
  return pair === SidePairs.Horizontal
    ? {
        left: start,
        top: line.span.min,
        width: GuideThicknessPx,
        height: length,
      }
    : {
        left: line.span.min,
        top: start,
        width: length,
        height: GuideThicknessPx,
      };
}

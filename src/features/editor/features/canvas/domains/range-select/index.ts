import { Offset } from "@/domains/unit/offset";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { DragThresholdPx } from "@/features/editor/features/canvas/domains/node-drag";
import { Option } from "@/utils/Option";

/**
 * 空き領域か artboard の背景から引いている選択の範囲（docs/06-ui.md「範囲選択」）。掴んだ点と
 * 今の点の対を、画面上の client 座標で持つ（実測 `DrawnBounds` と揃える）。
 *
 * ここが指すのは画面上の 2 次元の範囲。
 */
export type RangeSelect = Readonly<{
  from: Offset;
  to: Offset;
  /**
   * 一度でも閾値を超えたか（手ぶれと区別する / `extendedTo`）。
   *
   * 引いている間は逐次選び直すので、縮めた結果の「何も入らない」も選択へ反映しないと、広げた
   * ときの選択が残る。
   */
  isDrawn: boolean;
}>;

export const RangeSelect = {
  /**
   * 押した位置から始まる、まだ広がっていない範囲。
   *
   * @param from 押した位置（client 座標）
   * @returns 面積を持たず、まだ引かれていない範囲
   */
  create(from: Offset): RangeSelect {
    return { from, to: from, isDrawn: false };
  },

  /**
   * 引いている先を今の位置へ伸ばした範囲。掴んだ点は動かない。
   *
   * 掴んだ点から閾値ぶん離れた時点で「引かれた」に変わる。閾値を置かないと、
   * 空き領域を**クリックしただけ**で 0 面積の範囲が成立し、何も入らないので選択が
   * 外れる。クリックで選択が外れるのは docs/06-ui.md「キャンバスのクリックが選ぶ階層」
   * （外れるのは Esc など）と食い違う。閾値はノードと artboard のドラッグが使って
   * いるものと同じ（`DragThresholdPx`）。
   *
   * @param range 伸ばす範囲
   * @param to 今のポインタの位置（client 座標）
   * @returns 掴んだ点はそのままに、反対の角が今の位置へ来た範囲
   */
  extendedTo(range: RangeSelect, to: Offset): RangeSelect {
    const reachesThreshold = Offset.distance(range.from, to) >= DragThresholdPx;
    return {
      from: range.from,
      to,
      isDrawn: range.isDrawn || reachesThreshold,
    };
  },

  /**
   * その範囲が画面上で占める矩形。
   *
   * @param range 矩形にする範囲
   * @returns 2 点を対角にした矩形
   */
  bounds(range: RangeSelect): CanvasBounds {
    return CanvasBounds.spanning(range.from, range.to);
  },
} as const;

/**
 * 範囲を引き始めてから、離した直後の `click` を受けるまでの状態（docs/06-ui.md「範囲選択」）。
 * 引いている間だけ範囲を持つので直和で列挙する。
 *
 * `drawn` は範囲を引いて離した直後の状態（手ぶれだけで離したときは入らない）。artboard の背景から引くと `click` が枠へ上がって
 * artboard を選び直し、範囲で選んだものを上書きするので、その `click` を飲み込む。
 *
 * 飲み込み待ちを `NodeDrag` / `NodeResize` と共通の型へ出さないのは、どれも各ドラッグの直和の
 * 1 枝で、外へ出すと「掴んでいる、かつ飲み込み待ち」が型の上で作れてしまうため。
 */
export type RangeSelectDrag =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "drawing"; range: RangeSelect }>
  | Readonly<{ kind: "drawn" }>;

export const RangeSelectDrag = {
  /**
   * 操作を受ける前の状態を作る。
   *
   * @returns 何も引いていない状態
   */
  create(): RangeSelectDrag {
    return { kind: "idle" };
  },

  /**
   * 掴んだ点から範囲を引き始める。
   *
   * @param from 掴んだ点（client 座標）
   * @returns まだ広がっていない範囲を引いている状態
   */
  grab(from: Offset): RangeSelectDrag {
    return { kind: "drawing", range: RangeSelect.create(from) };
  },

  /**
   * 引いている範囲を今の位置へ伸ばす。
   *
   * @param drag 今の状態
   * @param to 今のポインタの位置（client 座標）
   * @returns 範囲を伸ばした状態。引いていなければ `drag` のまま
   */
  extendedTo(drag: RangeSelectDrag, to: Offset): RangeSelectDrag {
    if (drag.kind !== "drawing") {
      return drag;
    }
    return { kind: "drawing", range: RangeSelect.extendedTo(drag.range, to) };
  },

  /**
   * 指を離す。範囲が引かれていたなら直後の `click` を飲み込む状態へ入り、手ぶれだけなら
   * 何も引いていない状態へ戻す（押して離すだけの `click` は artboard の選択に使う）。
   *
   * @param drag 今の状態
   * @returns 直後の `click` を飲み込む状態、または何も引いていない状態
   */
  release(drag: RangeSelectDrag): RangeSelectDrag {
    const swallowsClick = drag.kind === "drawing" && drag.range.isDrawn;
    return swallowsClick ? { kind: "drawn" } : RangeSelectDrag.create();
  },

  /**
   * 離さないまま引くのをやめる（ポインタの捕捉が外れたとき）。範囲を引いている間だけ効き、
   * 離した直後の飲み込み待ちは残す（捕捉は離したあとにも外れる）。
   *
   * `NodeDrag` / `NodeResize` の取り消し（状態を問わず最初へ戻す）とは別物なので、名前を
   * 分けている。
   *
   * @param drag 今の状態
   * @returns 引いていたなら何も引いていない状態、そうでなければ `drag` のまま
   */
  stopDrawing(drag: RangeSelectDrag): RangeSelectDrag {
    return drag.kind === "drawing" ? RangeSelectDrag.create() : drag;
  },

  /**
   * 直後の `click` を選択に使わせないか。
   *
   * @param drag 今の状態
   * @returns 引いて離した直後なら `true`
   */
  consumesClick(drag: RangeSelectDrag): boolean {
    return drag.kind === "drawn";
  },

  /**
   * 今引いている範囲。
   *
   * @param drag 今の状態
   * @returns 引いている範囲。引いていなければ `none`
   */
  range(drag: RangeSelectDrag): Option<RangeSelect> {
    return drag.kind === "drawing" ? Option.some(drag.range) : Option.none;
  },
} as const;

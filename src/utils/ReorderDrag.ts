import { Option } from "@/utils/Option";

/**
 * 並びの中で 1 つを別の位置へ移す指定。
 * 今の位置と移す先は片方だけでは移動が決まらないため 1 つの型にまとめる
 * （同じ型の数が 2 つ並ぶので、位置引数だと取り違えても型エラーにならない）。
 */
export type ReorderMove = Readonly<{ fromIndex: number; toIndex: number }>;

/**
 * 並べ替えのために掴んでから離すまでの状態
 * （docs/06-ui.md「編集操作の一覧」の並べ替えは「ドラッグまたはツリービュー」）。
 *
 * 掴んだ位置しか持たない状態と、落ちる先まで決まった状態を分けて列挙するのは、
 * 「動かしていないのに落ちる先がある」を書けなくするため
 * （`features/canvas` の `NodeDrag` と同じ形。状態名も揃えてある）。
 *
 * `dropped`（離した直後）を持たないのは、行をまたいで離したときに行の `onClick` が
 * そもそも発火しないため。`click` は押した要素と離した要素の共通の祖先へ飛ぶので、
 * 別の行で離すと群の器（`<ul>`）が受け、行のボタンには届かない。同じ行へ戻って
 * 離した場合は移動先が元の位置なので並べ替えが起きず、押した行が選ばれるだけになる。
 *
 * `src/utils/` に置くのは、ドメイン知識を持たず React も要らない値だから。
 * Why not: `src/hooks/` の中に閉じない。React が無くても意味を持つ処理を hooks へ
 * 置かない（rules/hooks.md）。`src/domains/` にも置けない（横断層から import できない）。
 */
export type ReorderDrag =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "held"; fromIndex: number }>
  | Readonly<{ kind: "dragging"; fromIndex: number; toIndex: number }>;

/** 掴んでいない状態。 */
const Idle: ReorderDrag = { kind: "idle" };

export const ReorderDrag = {
  /** 掴んでいない状態から始める。 */
  create(): ReorderDrag {
    return Idle;
  },

  /**
   * その位置の行を掴む。まだ動かしていないので落ちる先は無い。
   *
   * @param fromIndex 掴んだ行の並びの中での位置
   * @returns 掴んだ状態
   */
  hold(fromIndex: number): ReorderDrag {
    return { kind: "held", fromIndex };
  },

  /**
   * ポインタが並びの中の行へ入ったことを反映する。
   *
   * 掴んでいなければ何も起きない（ただのホバー）。掴んだ行そのものへ入り直した
   * ときも動かしていないことと同じなので、落ちる先を持たない `held` へ戻す。
   *
   * @param drag 今の状態
   * @param index ポインタが入った行の位置
   * @returns 掴んでいれば落ちる先を更新した状態、掴んでいなければそのまま
   */
  enter(drag: ReorderDrag, index: number): ReorderDrag {
    if (drag.kind === "idle") {
      return drag;
    }
    return index === drag.fromIndex
      ? { kind: "held", fromIndex: drag.fromIndex }
      : { kind: "dragging", fromIndex: drag.fromIndex, toIndex: index };
  },

  /** 掴んでいない状態へ戻す（離した後・並びの外へ出た後）。 */
  cancel(): ReorderDrag {
    return Idle;
  },

  /**
   * 離したときに起きる移動。
   *
   * @param drag 離す前の状態
   * @returns 動かしていたならその移動。掴んだだけ・掴んでいないなら `none`
   */
  release(drag: ReorderDrag): Option<ReorderMove> {
    return drag.kind === "dragging"
      ? Option.some({ fromIndex: drag.fromIndex, toIndex: drag.toIndex })
      : Option.none;
  },

  /**
   * その位置の行が今掴まれているか。掴んでいる行を淡く見せるのに使う。
   *
   * @param drag 今の状態
   * @param index 見たい行の位置
   * @returns 掴んでいる行なら true
   */
  isHeld(drag: ReorderDrag, index: number): boolean {
    return drag.kind !== "idle" && drag.fromIndex === index;
  },

  /**
   * その位置の行が今の落ちる先か。落ちる先を示す線をどの行に引くかが決まる。
   *
   * @param drag 今の状態
   * @param index 見たい行の位置
   * @returns 動かしていて、その行が落ちる先なら true
   */
  isDropTarget(drag: ReorderDrag, index: number): boolean {
    return drag.kind === "dragging" && drag.toIndex === index;
  },

  /**
   * 落ちる先の行のどちら側に線を引くか。
   *
   * 上へ動かすなら入った行の上、下へ動かすなら下。落ちた結果その行の手前に入るのか
   * 後ろに入るのかは移動の向きで決まる（`ArrayEx.moveWithin` は間を詰める）。
   *
   * @param drag 今の状態
   * @returns 上へ動かしているなら `before`、下へ動かしているなら `after`。
   *   動かしていなければ `none`
   */
  dropSide(drag: ReorderDrag): Option<"before" | "after"> {
    if (drag.kind !== "dragging") {
      return Option.none;
    }
    return Option.some(drag.toIndex < drag.fromIndex ? "before" : "after");
  },
} as const;

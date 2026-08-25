import type { IndexMove } from "@/types/IndexMove";
import { Option } from "@/utils/Option";

/** 落ちる先を示す線を、行のどちら側へ引くか。 */
export type DropSide = "before" | "after";

/**
 * 並べ替えのために掴んでから離すまでの状態
 * （docs/06-ui.md「編集操作の一覧」の並べ替え）。
 *
 * 掴んだ位置しか持たない状態と、落ちる先まで決まった状態を分けて列挙するのは、
 * 「動かしていないのに落ちる先がある」を書けなくするため
 * （`features/canvas` の `NodeDrag` と同じ形。状態名と `create` / `grab` /
 * `release` の語彙も揃えてある）。
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
  /**
   * 掴んでいない状態。始点であり、離した後・並びの外へ出た後に戻る先でもある
   * （`NodeDrag` が `release` の中で `create()` へ戻すのと同じ形）。
   */
  create(): ReorderDrag {
    return Idle;
  },

  /**
   * その位置の行を掴む。まだ動かしていないので落ちる先は無い。
   *
   * @param fromIndex 掴んだ行の並びの中での位置
   * @returns 掴んだ状態
   */
  grab(fromIndex: number): ReorderDrag {
    return { kind: "held", fromIndex };
  },

  /**
   * ポインタが並びの中の行へ入ったことを反映する。
   *
   * 掴んでいなければ何も起きない（ただのホバー）。掴んだ行そのものへ入り直した
   * ときも動かしていないことと同じなので、落ちる先を持たない状態へ戻す。
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
      ? ReorderDrag.grab(drag.fromIndex)
      : { kind: "dragging", fromIndex: drag.fromIndex, toIndex: index };
  },

  /**
   * 離したときに起きる移動。
   *
   * 名前に戻り値を出しているのは、`NodeDrag.release` / `NodeResize.release` が
   * 「離した後の**状態**」を返すのに対し、ここが返すのは「起きた**移動**」だから
   * （状態を戻すのは `create()`）。同じ `release` にすると、同じ綴りが同じ層で
   * 2 つの意味を持つ（rules/naming.md「戻り値を名前に出す」）。
   *
   * @param drag 離す前の状態
   * @returns 動かしていたならその移動。掴んだだけ・掴んでいないなら `none`
   */
  releasedMove(drag: ReorderDrag): Option<IndexMove> {
    return drag.kind === "dragging"
      ? Option.some({ fromIndex: drag.fromIndex, toIndex: drag.toIndex })
      : Option.none;
  },

  /**
   * その位置の行が今掴まれているか。掴んでいる行を淡く見せるのに使う。
   *
   * 動かしている間も真。運んでいる最中こそ「どれを運んでいるか」が要るため。
   *
   * @param drag 今の状態
   * @param index 見たい行の位置
   * @returns 掴んでいる行なら true
   */
  isHeld(drag: ReorderDrag, index: number): boolean {
    return drag.kind !== "idle" && drag.fromIndex === index;
  },

  /**
   * その位置の行に落ちる先の線を引くなら、どちら側か。
   *
   * 前へ動かすと入った行の手前に、後ろへ動かすと入った行の後ろに落ちる
   * （`ArrayEx.moveWithin` が間を詰めるため）。
   *
   * 「落ちる先か」と「どちら側か」を 1 つのメソッドで返すのは、消費側が必ず対で
   * 要るため。分けると `isDropTarget(drag, index) ? dropSide(drag) : none` を
   * 各消費側が書くことになる（rules/coding.md「同じ処理が2箇所に現れたら共通化する」）。
   *
   * @param drag 今の状態
   * @param index 見たい行の位置
   * @returns その行が落ちる先ならどちら側か。落ちる先でなければ `none`
   */
  dropSideAt(drag: ReorderDrag, index: number): Option<DropSide> {
    if (drag.kind !== "dragging" || drag.toIndex !== index) {
      return Option.none;
    }
    return Option.some(drag.toIndex < drag.fromIndex ? "before" : "after");
  },
} as const;

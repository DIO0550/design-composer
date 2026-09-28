import { Offset } from "@/domains/unit/offset";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { DragThresholdPx } from "@/features/editor/features/canvas/domains/node-drag";
import { SideSnap } from "@/features/editor/features/canvas/domains/side-snap";
import { Option } from "@/utils/Option";

/**
 * 掴んでいる artboard と、掴んだ時点の位置。
 *
 * 動かした先の座標は「掴んだ時点の座標 + 掴んでからの移動量（と寄せ量）」で決まるので、
 * 名前・掴んだ時点の座標・ポインタを押した位置の 3 つは対でしか意味を持たない。
 */
export type ArtboardGrab = Readonly<{
  name: string;
  /** 掴んだ時点で artboard が描かれていた、キャンバス上の位置。 */
  grabbedAt: Offset;
  /** 掴んだ時点のポインタの位置（画面上）。移動量はここからの差で決まる。 */
  pointerOrigin: Offset;
}>;

/**
 * ポインタが動いた 1 回分（どちらも画面上の px）。
 *
 * 寄せ量はポインタの位置から `snapOffsetAt` で求めたもので、掴んでからの総量（前回までの
 * 寄せ量に足していく差分ではない）。
 */
export type ArtboardPointerMove = Readonly<{
  pointer: Offset;
  /** 揃う線へ寄せる量。揃う線が無ければ縦横とも 0 */
  snap: Offset;
}>;

/**
 * 寄せの判定に使う、描かれている artboard の実測（client 座標）。
 */
export type ArtboardSnapMeasure = Readonly<{
  /** 運んでいる artboard が今描かれている矩形（前回までの運搬ぶん既にずれている） */
  carried: CanvasBounds;
  /** 揃え先（運んでいる artboard 以外）の矩形。近さが同じときは先にあるほうへ寄る */
  stationary: readonly CanvasBounds[];
}>;

/** 運んでいる artboard と、その運び先。 */
export type ArtboardDragPreview = Readonly<{
  name: string;
  canvasPosition: Offset;
}>;

/**
 * キャンバス上で artboard を掴んでから離すまでの状態（docs/06-ui.md「キャンバス直接操作」
 * の artboard の移動）。掴んだものを持つのは離すまで、ポインタの位置と寄せ量（画面上の
 * px）を持つのは動かしている間だけ、と状態ごとに持つものが変わるので直和で列挙する。
 *
 * 「離した直後」の状態は持たない。**どちらの掴み口にも飲み込む相手が居ない**ためで（見
 * 出しは枠の兄弟なので `click` が上がらず、背景は運んだあと `click` そのものが出ない。
 * Chromium で実測）、無いのに入ると**次のクリックを食べる**。`click` を出す実装系のため
 * に飲み込む案も、背景を押すのが元から選択の操作なので採らない。
 */
export type ArtboardDrag =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "held"; grab: ArtboardGrab }>
  | Readonly<{
      kind: "dragging";
      grab: ArtboardGrab;
      pointer: Offset;
      snap: Offset;
    }>;

export const ArtboardDrag = {
  /**
   * 操作を受ける前の状態を作る。
   *
   * @returns 何も掴んでいない状態
   */
  create(): ArtboardDrag {
    return { kind: "idle" };
  },

  /**
   * 掴む。まだ動かしていないので、この時点ではクリックと区別が付かない。
   *
   * @param grab 掴んだ時点の状態（`ArtboardGrab`）
   * @returns 掴んだまま動かしていない状態
   */
  grab(grab: ArtboardGrab): ArtboardDrag {
    return { kind: "held", grab };
  },

  /**
   * ポインタが動いた先を反映する。
   *
   * @param drag 今のドラッグの状態
   * @param move 画面上のポインタの位置と、そこで寄せる量
   * @returns 閾値を越えていれば運んでいる状態。掴んでいなければそのまま
   */
  moveTo(drag: ArtboardDrag, move: ArtboardPointerMove): ArtboardDrag {
    if (drag.kind === "dragging") {
      return { ...drag, pointer: move.pointer, snap: move.snap };
    }
    if (drag.kind !== "held") {
      return drag;
    }
    return Offset.distance(drag.grab.pointerOrigin, move.pointer) <
      DragThresholdPx
      ? drag
      : {
          kind: "dragging",
          grab: drag.grab,
          pointer: move.pointer,
          snap: move.snap,
        };
  },

  /**
   * 掴んでいる artboard と、掴んだ時点の状態。
   *
   * @param drag 今のドラッグの状態
   * @returns 掴んだ時点の状態。掴んでいなければ `none`
   */
  grabbed(drag: ArtboardDrag): Option<ArtboardGrab> {
    switch (drag.kind) {
      case "held":
      case "dragging":
        return Option.some(drag.grab);
      case "idle":
        return Option.none;
    }
  },

  /**
   * ポインタをそこまで動かしたとき、他の artboard の辺か中心線へ寄せる量
   * （docs/06-ui.md「キャンバス直接操作」の artboard の移動）。
   *
   * 行き先の矩形は、今描かれている矩形を「今ずらして描いている量」から「そのポインタまで
   * 運んだ量」へ付け替えて作る。実測には前回までの運搬ぶんが既に乗っているため。
   *
   * `drag` は `drawn` を測った DOM を描いたときの状態を渡す（最新の状態を渡すと、描画より先
   * に届いた移動のぶんだけ「今ずらしている量」が実測と食い違う）。
   *
   * ノードのように原点の実測 + 掴んだ時点の座標で組む形は採らない。artboard には原点になる
   * 親が無く、座標平面（`ul`）は名前を持たないので実測の入口（`DrawnBounds`）から引けない。
   *
   * @param drag `drawn` を描いたときのドラッグの状態
   * @param pointer 画面上のポインタの位置
   * @param drawn 運んでいる artboard と揃え先の実測
   * @returns 寄せ量（画面上の px）。運んでいる artboard に大きさが無い（まだレイアウトされて
   *   いない）/ 閾値に届く線が無い / 掴んでいないなら縦横とも 0（掴んでいなければ呼び出し側は
   *   測らないので、最後の条件は起点を取り出すための型の上の枝）
   */
  snapOffsetAt(
    drag: ArtboardDrag,
    pointer: Offset,
    drawn: ArtboardSnapMeasure,
  ): Offset {
    const grab = ArtboardDrag.grabbed(drag);
    // 大きさの無い実測は原点に返るので、そこから行き先を作ると関係の無い辺へ吸い付く
    const measurable =
      Option.isSome(grab) && CanvasBounds.hasArea(drawn.carried);
    if (!measurable) {
      return Offset.Origin;
    }
    const moving = CanvasBounds.movedBy(
      drawn.carried,
      Offset.delta(
        carriedScreenOffset(drag),
        Offset.delta(grab.value.pointerOrigin, pointer),
      ),
    );
    return SideSnap.toSnapped(SideSnap.create(moving, drawn.stationary)).offset;
  },

  /**
   * 今運んでいる artboard と、その運び先。
   *
   * 画面上で運んだ量（ポインタの移動量 + 寄せ量）を倍率で割り戻して足すので、倍率を変えても
   * 掴んだ点に追従する。整数へ丸めるのはファイルへ書く側（`Artboard.withCanvasPosition`）。
   * 親を持たないので、ノードの座標移動（`RepositionDrop`）のような落とし先の親は無い。
   *
   * 分けると受け取る側が「片方だけある」場合の分岐を書くことになり、その分岐は実際には到達し
   * ない（＝テストで守れない）。
   *
   * @param drag 今のドラッグの状態
   * @param view 倍率を引く表示の状態
   * @returns 運んでいるものとその運び先。動かしていなければ `none`
   */
  preview(drag: ArtboardDrag, view: CanvasView): Option<ArtboardDragPreview> {
    if (drag.kind !== "dragging") {
      return Option.none;
    }
    const delta = CanvasView.toDocumentOffset(view, carriedScreenOffset(drag));
    return Option.some({
      name: drag.grab.name,
      canvasPosition: Offset.add(drag.grab.grabbedAt, delta),
    });
  },

  /**
   * 離す。掴んでいたものを手放して最初の状態へ戻す。
   *
   * @returns 何も掴んでいない状態
   */
  release(): ArtboardDrag {
    return ArtboardDrag.create();
  },
} as const;

/**
 * 今ずらして描いている画面上の量（ポインタの移動量 + 寄せ量）。
 *
 * 見せる位置（`preview`）と寄せの判定（`snapOffsetAt`）の両方がここから導く。別々に組むと、
 * 片方だけ直したときに見た目と吸い付く位置が食い違う。
 *
 * @param drag 今のドラッグの状態
 * @returns 運んでいる間はその量。掴んだだけ / 掴んでいないなら縦横とも 0
 */
function carriedScreenOffset(drag: ArtboardDrag): Offset {
  return drag.kind === "dragging"
    ? Offset.add(Offset.delta(drag.grab.pointerOrigin, drag.pointer), drag.snap)
    : Offset.Origin;
}

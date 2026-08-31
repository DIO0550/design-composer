import { Offset } from "@/domains/unit/offset";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import { DragThresholdPx } from "@/features/canvas/domains/node-drag";
import { Option } from "@/utils/Option";

/**
 * 掴んでいる artboard と、掴んだ時点の位置。
 *
 * 動かした先の座標は「掴んだ時点の座標 + 掴んでからの移動量」で決まるので、
 * 名前・掴んだ時点の座標・ポインタを押した位置の 3 つは対でしか意味を持たない。
 */
export type ArtboardGrab = Readonly<{
  name: string;
  from: Offset;
  origin: Offset;
}>;

/**
 * キャンバス上で artboard を掴んでから離すまでの状態
 * （docs/06-ui.md「キャンバス直接操作」の artboard の移動）。
 *
 * ノードのドラッグ（`NodeDrag`）と別の状態機械にしているのは、artboard の移動が
 * **ツリーの操作ではない**ため。同じ状態機械へ載せると「artboard をツリーへ移動する」
 * が型で書けてしまう。
 *
 * 掴んだものを持つのは離すまで、ポインタの位置を持つのは動かしている間だけ、と
 * 状態ごとに持つものが変わるので直和で列挙する。
 *
 * `dropped` は離した直後の状態。ブラウザは `pointerup` のあとに `click` を発火させるので、
 * これを挟まないと動かしただけで選択が動く（`NodeDrag` / `NodeResize` と同じ扱い）。
 */
export type ArtboardDrag =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "held"; grab: ArtboardGrab }>
  | Readonly<{ kind: "dragging"; grab: ArtboardGrab; pointer: Offset }>
  | Readonly<{ kind: "dropped" }>;

export const ArtboardDrag = {
  /** 何も掴んでいない状態から始める。 */
  create(): ArtboardDrag {
    return { kind: "idle" };
  },

  /** 掴む。まだ動かしていないので、この時点ではクリックと区別が付かない。 */
  grab(grab: ArtboardGrab): ArtboardDrag {
    return { kind: "held", grab };
  },

  /**
   * ポインタが動いた先を反映する。
   * 閾値までの動きはクリックとして扱うので、`held` のまま動かさない
   * （閾値の値と理由は `DragThresholdPx`）。
   *
   * @param drag 今のドラッグの状態
   * @param pointer 画面上のポインタの位置
   * @returns 閾値を越えていれば運んでいる状態。掴んでいなければそのまま
   */
  moveTo(drag: ArtboardDrag, pointer: Offset): ArtboardDrag {
    if (drag.kind === "dragging") {
      return { ...drag, pointer };
    }
    if (drag.kind !== "held") {
      return drag;
    }
    return Offset.distance(drag.grab.origin, pointer) < DragThresholdPx
      ? drag
      : { kind: "dragging", grab: drag.grab, pointer };
  },

  /**
   * 今の運び先のキャンバス上の座標。
   *
   * 画面上の移動量を倍率で割り戻して足すので、倍率を変えても掴んだ点に追従する。
   * 親を持たないので、ノードの座標移動（`RepositionLimit`）のような収める先は無い。
   *
   * @param drag 今のドラッグの状態
   * @param view 倍率を引く表示の状態
   * @returns 運び先の座標。動かしていなければ `none`
   */
  positionAt(drag: ArtboardDrag, view: CanvasView): Option<Offset> {
    if (drag.kind !== "dragging") {
      return Option.none;
    }
    const delta = CanvasView.toDocumentOffset(
      view,
      Offset.delta(drag.grab.origin, drag.pointer),
    );
    return Option.some(Offset.add(drag.grab.from, delta));
  },

  /**
   * 運んでいる artboard の名前。運んでいる間だけ答える。
   *
   * @param drag 今のドラッグの状態
   * @returns 運んでいる artboard の名前。動かしていなければ `none`
   */
  draggedName(drag: ArtboardDrag): Option<string> {
    return drag.kind === "dragging" ? Option.some(drag.grab.name) : Option.none;
  },

  /**
   * 離す。動かしていたなら直後の `click` を飲み込む状態にする。
   *
   * @param drag 離す時点のドラッグの状態
   * @returns 動かしていたなら `dropped`、掴んだだけなら最初の状態
   */
  release(drag: ArtboardDrag): ArtboardDrag {
    return drag.kind === "dragging"
      ? { kind: "dropped" }
      : ArtboardDrag.create();
  },

  /** 直後の `click` を選択に使わせないか。 */
  consumesClick(drag: ArtboardDrag): boolean {
    return drag.kind === "dropped";
  },
} as const;

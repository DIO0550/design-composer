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
  /** 掴んだ時点で artboard が描かれていた、キャンバス上の位置。 */
  grabbedAt: Offset;
  /** 掴んだ時点のポインタの位置（画面上）。移動量はここからの差で決まる。 */
  pointerOrigin: Offset;
}>;

/** 運んでいる artboard と、その運び先。 */
export type ArtboardDragPreview = Readonly<{
  name: string;
  canvasPosition: Offset;
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
 * `NodeDrag` / `NodeResize` が持つ「離した直後」の状態は持たない。**どちらの掴み口にも
 * 飲み込む相手が居ない**ため（見出しは枠の兄弟なので `click` が枠へ上がってこず、背景は
 * 運んだあと `click` そのものが出ない。後者は Chromium で実測 — `mousedown` と `mouseup`
 * の相手は同じ枠なのに、閾値を越えて動かすと `click` だけが出ない）。飲み込むものが
 * 無いのにその状態へ入ると、**次のクリックを食べる**（`NodeDrag.release` と同じ形）。
 *
 * Why not: `click` を出す実装系のために飲み込む、は採らない。**背景を押すのは元から
 * 選択の操作**なので、運んだ artboard が選ばれるだけで害が無い。
 */
export type ArtboardDrag =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "held"; grab: ArtboardGrab }>
  | Readonly<{ kind: "dragging"; grab: ArtboardGrab; pointer: Offset }>;

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
    return Offset.distance(drag.grab.pointerOrigin, pointer) < DragThresholdPx
      ? drag
      : { kind: "dragging", grab: drag.grab, pointer };
  },

  /**
   * 今運んでいる artboard と、その運び先。
   *
   * 画面上の移動量を倍率で割り戻して足すので、倍率を変えても掴んだ点に追従する。
   * 親を持たないので、ノードの座標移動（`RepositionLimit`）のような収める先は無い。
   *
   * 名前と運び先を別のアクセサに分けないのは、どちらも運んでいる間だけ存在するため。
   * 分けると受け取る側が「片方だけある」場合の分岐を書くことになり、その分岐は
   * 実際には到達しない（＝テストで守れない）。
   *
   * @param drag 今のドラッグの状態
   * @param view 倍率を引く表示の状態
   * @returns 運んでいるものとその運び先。動かしていなければ `none`
   */
  preview(drag: ArtboardDrag, view: CanvasView): Option<ArtboardDragPreview> {
    if (drag.kind !== "dragging") {
      return Option.none;
    }
    const delta = CanvasView.toDocumentOffset(
      view,
      Offset.delta(drag.grab.pointerOrigin, drag.pointer),
    );
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

import { DesignDocument } from "@/domains/design-document";
import { CanvasOffset } from "@/features/editor/domains/canvas-view";
import type { DropTarget } from "@/features/editor/domains/node-drop";
import { Option } from "@/utils/Option";

/**
 * キャンバス上でノードを掴んでから離すまでの状態
 * （docs/06-ui.md「キャンバス直接操作」の移動）。
 *
 * 掴んだ位置を持つのは動き出す前だけ、落ちる先を持つのは動かしている間だけ、と
 * 状態ごとに持つものが変わるため直和で列挙する（「動かしていないのに落ちる先がある」
 * のような組み合わせを作れなくするため）。
 *
 * `dropped` は離した直後の状態。ブラウザは `pointerup` のあとに `click` を発火させるので、
 * これを挟まないと運んだ先の要素が選択されてしまう（選択は #35 / `EditorState` の担当で、
 * 移動は選択を変えない）。閾値未満の動き（＝ただのクリック）ではここへ入らない。
 */
export type NodeDrag =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "held"; name: string; origin: CanvasOffset }>
  | Readonly<{ kind: "dragging"; name: string; drop: Option<DropTarget> }>
  | Readonly<{ kind: "dropped" }>;

/**
 * ここまでの動きはクリックとして扱う（px）。
 * 閾値を置かないと、押したときの手ぶれで選択がドラッグに化けて選択できなくなる。
 */
const DRAG_THRESHOLD_PX = 4;

export const NodeDrag = {
  /** 何も掴んでいない状態から始める。 */
  create(): NodeDrag {
    return { kind: "idle" };
  },

  /**
   * 内側から外へ並べた候補のうち、最も内側の掴めるノードの名前。
   *
   * 掴めるのは artboard 配下のノードだけ。artboard 自身は誰の子でもなく
   * （`DesignDocument.findChildPosition` が `none`）ツリー内の移動先を持たない
   * （artboard の並べ替えは別の操作 / docs/06-ui.md「編集操作の一覧」）。
   * 部品インスタンスの中身はドキュメントの木に無いので、そこを押すと
   * インスタンス自身が掴まれる（選択と同じ振る舞い / #35）。
   */
  grabbableName(
    document: DesignDocument,
    names: readonly string[],
  ): Option<string> {
    return Option.fromNullable(
      names.find((name) => DesignDocument.findNode(document, name).some),
    );
  },

  /** ノードを掴む。まだ動かしていないので、この時点ではクリックと区別が付かない。 */
  grab(name: string, origin: CanvasOffset): NodeDrag {
    return { kind: "held", name, origin };
  },

  /** 掴んでいるノードの名前。動き出す前も掴んではいるので `held` でも答える。 */
  heldName(drag: NodeDrag): Option<string> {
    switch (drag.kind) {
      case "held":
      case "dragging":
        return Option.some(drag.name);
      case "idle":
      case "dropped":
        return Option.none;
    }
  },

  /**
   * ポインタの移動を反映する。閾値を越えたところで初めて「動かしている」状態になる。
   * 掴んでいなければ何も起きない（ボタンを離したあとのマウス移動）。
   */
  moveTo(
    drag: NodeDrag,
    pointer: CanvasOffset,
    drop: Option<DropTarget>,
  ): NodeDrag {
    if (drag.kind === "dragging") {
      return { ...drag, drop };
    }
    if (drag.kind !== "held") {
      return drag;
    }
    return CanvasOffset.distance(drag.origin, pointer) < DRAG_THRESHOLD_PX
      ? drag
      : { kind: "dragging", name: drag.name, drop };
  },

  /** 今ドロップしたら落ちる位置。動かしていて、かつ受け入れられる先の上にいるときだけ。 */
  dropTarget(drag: NodeDrag): Option<DropTarget> {
    return drag.kind === "dragging" ? drag.drop : Option.none;
  },

  /**
   * 指を離す。動かしていたなら直後の `click` を飲み込む状態へ、
   * 動かしていなかったなら何も起きていないので掴んでいない状態へ戻す。
   */
  release(drag: NodeDrag): NodeDrag {
    return drag.kind === "dragging" ? { kind: "dropped" } : NodeDrag.create();
  },

  /** 直後の `click` を選択に使わせないか（上の `dropped` の説明を参照）。 */
  consumesClick(drag: NodeDrag): boolean {
    return drag.kind === "dropped";
  },

  isDragging(drag: NodeDrag): boolean {
    return drag.kind === "dragging";
  },
} as const;

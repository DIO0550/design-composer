import { DesignDocument } from "@/domains/design-document";
import type { NodeTemplate } from "@/domains/node-template";
import { CanvasOffset } from "@/features/canvas/domains/canvas-view";
import {
  DraggedNode,
  type DropTarget,
} from "@/features/canvas/domains/node-drop";
import { Option } from "@/utils/Option";

/**
 * 何かを掴んでからキャンバスで離すまでの状態（docs/06-ui.md「キャンバス直接操作」の
 * 移動と、「編集操作の一覧」の挿入）。
 *
 * 掴んだ位置を持つのは動き出す前だけ、落ちる先を持つのは動かしている間だけ、と
 * 状態ごとに持つものが変わるため直和で列挙する（「動かしていないのに落ちる先がある」
 * のような組み合わせを作れなくするため）。
 *
 * 掴むのはキャンバス上の既存ノードとパレットの雛形の2通りで、どちらを運んでいるかは
 * `DraggedNode` が持つ。状態遷移は同じ（閾値・落とし先の解決・提示）なので、
 * 2つのドラッグには分けない。分けるとキャンバスが落とし先を2つ受け取ることになり、
 * 「両方ドラッグ中」が型で書けてしまう。
 *
 * `dropped` は既存ノードを離した直後の状態。ブラウザは `pointerup` のあとに `click` を
 * 発火させるので、これを挟まないと運んだ先の要素が選択されてしまう（選択を持つのは
 * 編集画面の側で / #35、移動は選択を変えない）。閾値未満の動き（＝ただのクリック）
 * ではここへ入らない。
 */
export type NodeDrag =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "held"; dragged: DraggedNode; origin: CanvasOffset }>
  | Readonly<{
      kind: "dragging";
      dragged: DraggedNode;
      drop: Option<DropTarget>;
    }>
  | Readonly<{ kind: "dropped" }>;

/**
 * ここまでの動きはクリックとして扱う（px）。
 * 閾値を置かないと、押したときの手ぶれで選択がドラッグに化けて選択できなくなる。
 */
const DragThresholdPx = 4;

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
   *
   * @param document 名前の引き先になるドキュメント
   * @param names 押された位置から根へ向かう順のノード名
   * @returns 最も内側の掴めるノードの名前。1つも掴めなければ `none`
   */
  grabbableName(
    document: DesignDocument,
    names: readonly string[],
  ): Option<string> {
    return Option.fromNullable(
      names.find((name) => DesignDocument.findNode(document, name).some),
    );
  },

  /** 掴む。まだ動かしていないので、この時点ではクリックと区別が付かない。 */
  grab(dragged: DraggedNode, origin: CanvasOffset): NodeDrag {
    return { kind: "held", dragged, origin };
  },

  /**
   * 掴んでいるもの。動き出す前も掴んではいるので `held` でも答える。
   *
   * @param drag 今のドラッグの状態
   * @returns 掴んでいるもの。掴んでいなければ `none`
   */
  heldNode(drag: NodeDrag): Option<DraggedNode> {
    switch (drag.kind) {
      case "held":
      case "dragging":
        return Option.some(drag.dragged);
      case "idle":
      case "dropped":
        return Option.none;
    }
  },

  /**
   * 今まさに運んでいるもの。閾値を越えて動かしている間だけ答える。
   *
   * `heldNode` と分けているのは、掴んだ行の強調やツールバーの点灯が「運んでいる」
   * ことの表示だから。押しただけで点くと、クリックのたびに一瞬光る。
   *
   * @param drag 今のドラッグの状態
   * @returns 運んでいるもの。動かしていなければ `none`
   */
  carriedNode(drag: NodeDrag): Option<DraggedNode> {
    return drag.kind === "dragging" ? Option.some(drag.dragged) : Option.none;
  },

  /**
   * 今まさにパレットから運んでいる雛形。
   *
   * 運んでいるものの種別まで見るのは、掴んだ行の強調とキャンバスのツールバーの点灯が
   * 「パレットから運んでいる」ときだけの表示だから（既存ノードの移動では点かない）。
   *
   * @param drag 今のドラッグの状態
   * @returns 運んでいる雛形。動かしていない / 既存ノードを運んでいるときは `none`
   */
  carriedTemplate(drag: NodeDrag): Option<NodeTemplate> {
    return Option.flatMap(NodeDrag.carriedNode(drag), DraggedNode.template);
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
    return CanvasOffset.distance(drag.origin, pointer) < DragThresholdPx
      ? drag
      : { kind: "dragging", dragged: drag.dragged, drop };
  },

  /** 今ドロップしたら落ちる位置。動かしていて、かつ受け入れられる先の上にいるときだけ。 */
  dropTarget(drag: NodeDrag): Option<DropTarget> {
    return drag.kind === "dragging" ? drag.drop : Option.none;
  },

  /**
   * 指を離す。
   *
   * 既存ノードを運んでいたなら直後の `click` を飲み込む状態へ入る。パレットの雛形を
   * 運んでいたときに入らないのは、押した場所（パレットの行）と離した場所（キャンバス）が
   * 別の枝にあり、`click` が両者の共通の祖先へ飛ぶため。キャンバスの枠までは上がって
   * こないので飲み込むものが無く、それでも `dropped` に入ると**次のクリック**を
   * 食べてしまう（選択が1回黙って消える）。
   *
   * 動かしていなかったなら何も起きていないので、どちらの場合も掴んでいない状態へ戻す。
   */
  release(drag: NodeDrag): NodeDrag {
    const swallowsClick =
      drag.kind === "dragging" && drag.dragged.kind === "existing";
    return swallowsClick ? { kind: "dropped" } : NodeDrag.create();
  },

  /** 直後の `click` を選択に使わせないか（上の `dropped` の説明を参照）。 */
  consumesClick(drag: NodeDrag): boolean {
    return drag.kind === "dropped";
  },

  isDragging(drag: NodeDrag): boolean {
    return drag.kind === "dragging";
  },
} as const;

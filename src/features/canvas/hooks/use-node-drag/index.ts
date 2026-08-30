import { type PointerEvent as ReactPointerEvent, useReducer } from "react";
import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import type { DesignDocument } from "@/domains/dcmp/design-document";
import type { NodeTemplate } from "@/domains/session/node-template";
import type { Offset } from "@/domains/unit/offset";
import { NodeDrag } from "@/features/canvas/domains/node-drag";
import {
  CanvasBounds,
  type DraggedNode,
  DropParent,
  type DropTarget,
  DropZone,
} from "@/features/canvas/domains/node-drop";
import { CanvasPointer } from "@/features/canvas/utils/CanvasPointer";
import { CanvasDom } from "@/libs/canvas-dom";
import { ElementEx } from "@/utils/ElementEx";
import { Option } from "@/utils/Option";

/** ドラッグの進み方（docs/06-ui.md「キャンバス直接操作」の移動と、挿入）。 */
type NodeDragAction =
  | Readonly<{ type: "grab"; dragged: DraggedNode; origin: Offset }>
  | Readonly<{ type: "move"; pointer: Offset; drop: Option<DropTarget> }>
  | Readonly<{ type: "release" }>
  | Readonly<{ type: "cancel" }>
  | Readonly<{ type: "consume_click" }>;

/**
 * アクションの解釈だけを行い、状態の組み立ては NodeDrag に委ねる。
 *
 * @param drag 今のドラッグの状態
 * @param action 解釈するアクション
 * @returns 遷移後のドラッグの状態
 */
function nodeDragReducer(drag: NodeDrag, action: NodeDragAction): NodeDrag {
  switch (action.type) {
    case "grab":
      return NodeDrag.grab(action.dragged, action.origin);
    case "move":
      return NodeDrag.moveTo(drag, action.pointer, action.drop);
    case "release":
      return NodeDrag.release(drag);
    case "cancel":
    case "consume_click":
      // 掴んだものを手放して最初の状態へ戻す（取り消しも、click を飲み込んだあとも同じ）。
      return NodeDrag.create();
  }
}

/**
 * 押された位置から外へ辿ったノード名（キャンバスは名前を属性として残している）。
 *
 * @param target イベントが起きた要素
 * @returns 内側から根へ向かう順のノード名の並び
 */
function namesToRoot(target: EventTarget): readonly string[] {
  return ElementEx.attributeValuesToRoot(target, ElementNameAttribute);
}

/**
 * 親と、その直下に並ぶ子の矩形を実測する。
 * 子は名前を持つ直下の要素だけを拾う（コンパイル結果は子ノードを直下の `div` として
 * 並び順のまま出すので、DOM の順序がそのままドキュメント上の順序になる）。
 *
 * @param parent 実測する落とし先の親
 * @returns 親と子の矩形を持つ落とし先の帯。親の要素が画面に無ければ `none`
 */
function measureZone(parent: DropParent): Option<DropZone> {
  return Option.map(CanvasDom.elementOf(parent.name), (element) =>
    DropZone.create(
      parent,
      CanvasBounds.ofElement(element),
      Array.from(element.children)
        .filter((child) => child.hasAttribute(ElementNameAttribute))
        .map(CanvasBounds.ofElement),
    ),
  );
}

/**
 * ポインタの下にある、運んでいるものを受け入れられる位置。
 *
 * @param document 落とし先を決めるためのドキュメント
 * @param dragged 運んでいるもの
 * @param event 今のポインタの位置を持つイベント
 * @returns 落とせる親と、その中での挿入位置。受け入れられる親が無ければ `none`
 */
function dropTargetAt(
  document: DesignDocument,
  dragged: DraggedNode,
  event: ReactPointerEvent<HTMLElement>,
): Option<DropTarget> {
  const parent = DropParent.innermost(
    document,
    dragged,
    namesToRoot(event.target),
  );
  return Option.map(Option.flatMap(parent, measureZone), (zone) =>
    DropZone.targetAt(zone, CanvasPointer.offsetOf(event)),
  );
}

/** キャンバスの既存ノードを掴む側（artboard の枠）へ渡す props。 */
export type NodeGrabHandlers = Readonly<{
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
}>;

/** 運んでいる間のポインタを追う側（3 ペインの器）へ渡す props。 */
export type NodeDragHandlers = Readonly<{
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
}>;

/** ドラッグ中の状態と、画面の要素へ渡すハンドラ。 */
export type NodeDragControl = Readonly<{
  drag: NodeDrag;
  /**
   * 今パレットから運んでいる雛形。掴んだ行の強調とキャンバスのツールバーの点灯が
   * これで決まる。運んでいない / 既存ノードを運んでいるなら `none`。
   *
   * **この配線を外してもテストは 1 件も落ちない** — 届く先はどちらも class の
   * 差し替えだけ（`asset-row` の強調 / `canvas-toolbar` の `◆` の背景）で、
   * happy-dom では見えない。気づく手段は Storybook の視覚差分だけ。
   */
  carriedTemplate: Option<NodeTemplate>;
  grabHandlers: NodeGrabHandlers;
  dragHandlers: NodeDragHandlers;
  /** パレットの行から掴む。掴めるものは行が知っているので指定を受け取る。 */
  grabTemplate: (
    template: NodeTemplate,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  /** ドラッグ直後の `click` を飲み込む。飲み込んだ（＝選択に使わない）なら `true`。 */
  consumeClick: () => boolean;
}>;

/**
 * 掴んでキャンバスへ落とす操作を、ツリー上の位置への移動・挿入として解釈する
 * （docs/06-ui.md「キャンバス直接操作」/ docs/02-data-model.md「基本原則」）。
 *
 * このフックが持つのは DOM の実測とイベントの仲介だけで、
 * 「どこへ落ちるか」「いつドラッグとみなすか」の判定は `node-drop` / `node-drag` にある。
 *
 * ポインタキャプチャを使わないのは、捕捉すると以後のイベントの `target` が捕捉した要素に
 * 固定され、「今どのノードの上にいるか」を読めなくなるため。代わりに掴んだあとの
 * ポインタは 3 ペインの器全体で受ける。キャンバスの中だけで受けると、パレットの行で
 * 掴んで左ペインの上で離したときに `pointerup` が届かず、掴んだまま戻らなくなる。
 *
 * @param params 落とし先を決める `document` と、移動・挿入が確定したときに呼ぶ
 *   `onMove` / `onInsertAt`
 * @returns 今のドラッグの状態と、画面の要素へ渡すハンドラ
 */
export function useNodeDrag(
  params: Readonly<{
    document: DesignDocument;
    onMove: (name: string, to: ChildPosition) => void;
    onInsertAt: (template: NodeTemplate, at: ChildPosition) => void;
  }>,
): NodeDragControl {
  const [drag, dispatch] = useReducer(
    nodeDragReducer,
    undefined,
    NodeDrag.create,
  );

  const grab = (event: ReactPointerEvent<HTMLElement>) => {
    const name = NodeDrag.grabbableName(
      params.document,
      namesToRoot(event.target),
    );
    if (!name.some) {
      return;
    }
    dispatch({
      type: "grab",
      dragged: { kind: "existing", name: name.value },
      origin: CanvasPointer.offsetOf(event),
    });
  };

  const grabTemplate = (
    template: NodeTemplate,
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    dispatch({
      type: "grab",
      dragged: { kind: "new", template },
      origin: CanvasPointer.offsetOf(event),
    });
  };

  const trackPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const held = NodeDrag.heldNode(drag);
    if (!held.some) {
      return;
    }
    dispatch({
      type: "move",
      pointer: CanvasPointer.offsetOf(event),
      drop: dropTargetAt(params.document, held.value, event),
    });
  };

  /**
   * 離した時点で提示していた位置へ落とす（最後に届いた移動が決めた先）。
   * 運んでいたものが木にある既存ノードなら移動、パレットの雛形なら挿入になる。
   */
  const release = () => {
    const held = NodeDrag.heldNode(drag);
    const target = NodeDrag.dropTarget(drag);
    if (held.some && target.some) {
      const at = target.value.position;
      if (held.value.kind === "existing") {
        params.onMove(held.value.name, at);
      } else {
        params.onInsertAt(held.value.template, at);
      }
    }
    dispatch({ type: "release" });
  };

  return {
    drag,
    carriedTemplate: NodeDrag.carriedTemplate(drag),
    grabHandlers: { onPointerDown: grab },
    grabTemplate,
    dragHandlers: {
      onPointerMove: trackPointer,
      onPointerUp: release,
      onPointerLeave: () => dispatch({ type: "cancel" }),
    },
    consumeClick: () => {
      if (!NodeDrag.consumesClick(drag)) {
        return false;
      }
      dispatch({ type: "consume_click" });
      return true;
    },
  };
}

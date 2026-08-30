import { type PointerEvent as ReactPointerEvent, useReducer } from "react";
import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { AbsolutePlacement } from "@/domains/dcmp/placement";
import { Placement } from "@/domains/dcmp/placement";
import type { NodeTemplate } from "@/domains/session/node-template";
import { Offset } from "@/domains/unit/offset";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import {
  DropEdit,
  type Grab,
  NodeDrag,
} from "@/features/canvas/domains/node-drag";
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

/** ドラッグの進み方（docs/06-ui.md「キャンバス直接操作」の移動・座標の置き直しと、挿入）。 */
type NodeDragAction =
  | Readonly<{ type: "grab"; grab: Grab }>
  | Readonly<{ type: "move"; pointer: Offset; drop: Option<DropEdit> }>
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
      return NodeDrag.grab(action.grab);
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

/** 落とし方を決めるのに要るもの（今の掴みと、それを解釈するための材料）。 */
type DropContext = Readonly<{
  document: DesignDocument;
  grab: Grab;
  view: CanvasView;
  event: ReactPointerEvent<HTMLElement>;
}>;

/**
 * 今の掴みを座標の置き直しとして読んだ結果。
 *
 * ドラッグの意味を決めるのは運んでいるノード自身の `placement` で、パレットの雛形は
 * まだ木に無いので対象外（挿入にしかならない）。座標は掴んだ時点の値に、画面上の
 * 移動量を倍率で割り戻したものを足す（倍率を変えても掴んだ点に追従する）。
 *
 * @param context 今の掴みと、配置の引き先になるドキュメント・倍率・ポインタ
 * @returns 座標の置き直しの編集。パレットの雛形を運んでいる / 座標で動かせない
 *   ノードを運んでいる（`DesignDocument.absolutePlacementOf` が `none`）なら `none`
 */
function repositionAt(context: DropContext): Option<DropEdit> {
  const dragged = context.grab.dragged;
  if (dragged.kind !== "existing") {
    return Option.none;
  }
  const placement = DesignDocument.absolutePlacementOf(
    context.document,
    dragged.name,
  );
  if (!placement.some) {
    return Option.none;
  }
  const delta = CanvasView.toDocumentOffset(
    context.view,
    Offset.delta(context.grab.origin, CanvasPointer.offsetOf(context.event)),
  );
  return Option.some(
    DropEdit.reposition(dragged.name, Placement.moveBy(placement.value, delta)),
  );
}

/**
 * 今ドロップしたら届く編集。
 * 絶対配置のノードを運んでいるなら座標の置き直し、そうでなければツリーへの移動・挿入。
 *
 * @param context 今の掴みと、落とし先を決めるための材料
 * @returns 届く編集。落とせる先が無ければ `none`
 */
function dropEditAt(context: DropContext): Option<DropEdit> {
  const repositioned = repositionAt(context);
  if (repositioned.some) {
    return repositioned;
  }
  return Option.map(
    dropTargetAt(context.document, context.grab.dragged, context.event),
    (target) => DropEdit.intoTree(context.grab.dragged, target),
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
 * 掴んでキャンバスへ落とす操作を、ツリー上の位置への移動・挿入か、絶対配置の
 * ノードの座標の置き直しとして解釈する
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
 * @param params 落とし先を決める `document` / `view` と、確定したときに呼ぶ
 *   `onMove` / `onInsertAt` / `onReposition`
 * @returns 今のドラッグの状態と、画面の要素へ渡すハンドラ
 */
export function useNodeDrag(
  params: Readonly<{
    document: DesignDocument;
    view: CanvasView;
    onMove: (name: string, to: ChildPosition) => void;
    onInsertAt: (template: NodeTemplate, at: ChildPosition) => void;
    onReposition: (name: string, placement: AbsolutePlacement) => void;
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
      grab: {
        dragged: { kind: "existing", name: name.value },
        origin: CanvasPointer.offsetOf(event),
      },
    });
  };

  const grabTemplate = (
    template: NodeTemplate,
    event: ReactPointerEvent<HTMLElement>,
  ) => {
    dispatch({
      type: "grab",
      grab: {
        dragged: { kind: "new", template },
        origin: CanvasPointer.offsetOf(event),
      },
    });
  };

  const trackPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const grabbed = NodeDrag.grabbed(drag);
    if (!grabbed.some) {
      return;
    }
    dispatch({
      type: "move",
      pointer: CanvasPointer.offsetOf(event),
      drop: dropEditAt({
        document: params.document,
        grab: grabbed.value,
        view: params.view,
        event,
      }),
    });
  };

  /** 届いた編集を、それぞれの受け口へ流す。 */
  const applyDrop = (drop: DropEdit) => {
    switch (drop.kind) {
      case "move":
        params.onMove(drop.name, drop.target.position);
        return;
      case "insert":
        params.onInsertAt(drop.template, drop.target.position);
        return;
      case "reposition":
        params.onReposition(drop.name, drop.placement);
        return;
    }
  };

  /**
   * 離した時点で提示していた落とし方で落とす（最後に届いた移動が決めた編集）。
   * 誰をどう動かすかは `DropEdit` が持っているので、ここでは運んでいたものを見ない。
   */
  const release = () => {
    const drop = NodeDrag.drop(drag);
    if (drop.some) {
      applyDrop(drop.value);
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

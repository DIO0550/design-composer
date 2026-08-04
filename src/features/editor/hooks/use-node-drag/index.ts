import { type PointerEvent as ReactPointerEvent, useReducer } from "react";
import { ELEMENT_NAME_ATTRIBUTE } from "@/domains/compiled-element";
import type { ChildPosition, DesignDocument } from "@/domains/design-document";
import type { CanvasOffset } from "@/features/editor/domains/canvas-view";
import { NodeDrag } from "@/features/editor/domains/node-drag";
import {
  type CanvasBounds,
  DropParent,
  type DropTarget,
  DropZone,
} from "@/features/editor/domains/node-drop";
import { Css } from "@/utils/Css";
import { ElementEx } from "@/utils/ElementEx";
import { Option } from "@/utils/Option";

/** ドラッグの進み方（docs/06-ui.md「キャンバス直接操作」の移動）。 */
type NodeDragAction =
  | Readonly<{ type: "grab"; name: string; origin: CanvasOffset }>
  | Readonly<{ type: "move"; pointer: CanvasOffset; drop: Option<DropTarget> }>
  | Readonly<{ type: "release" }>
  | Readonly<{ type: "cancel" }>
  | Readonly<{ type: "consume_click" }>;

/** アクションの解釈だけを行い、状態の組み立ては NodeDrag に委ねる。 */
function nodeDragReducer(drag: NodeDrag, action: NodeDragAction): NodeDrag {
  switch (action.type) {
    case "grab":
      return NodeDrag.grab(action.name, action.origin);
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

/** 押された位置から外へ辿ったノード名（キャンバスは名前を属性として残している）。 */
function namesToRoot(target: EventTarget): readonly string[] {
  return ElementEx.attributeValuesToRoot(target, ELEMENT_NAME_ATTRIBUTE);
}

function pointerOf(event: ReactPointerEvent<HTMLElement>): CanvasOffset {
  return { x: event.clientX, y: event.clientY };
}

/**
 * 名前で描かれている要素。名前はドキュメント全体で一意なので 1 つに決まる
 * （部品インスタンスの中身も展開時に自動リネームされる / docs/06-ui.md「解除」）。
 */
function elementOf(name: string): Option<Element> {
  return Option.fromNullable(
    globalThis.document.querySelector(
      `[${ELEMENT_NAME_ATTRIBUTE}="${Css.escapeQuotedString(name)}"]`,
    ),
  );
}

function boundsOf(element: Element): CanvasBounds {
  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * 親と、その直下に並ぶ子の矩形を実測する。
 * 子は名前を持つ直下の要素だけを拾う（コンパイル結果は子ノードを直下の `div` として
 * 並び順のまま出すので、DOM の順序がそのままドキュメント上の順序になる）。
 */
function measureZone(parent: DropParent): Option<DropZone> {
  return Option.map(elementOf(parent.name), (element) =>
    DropZone.create(
      parent,
      boundsOf(element),
      Array.from(element.children)
        .filter((child) => child.hasAttribute(ELEMENT_NAME_ATTRIBUTE))
        .map(boundsOf),
    ),
  );
}

/** ポインタの下にある、掴んでいるノードを受け入れられる位置。 */
function dropTargetAt(
  document: DesignDocument,
  heldName: string,
  event: ReactPointerEvent<HTMLElement>,
): Option<DropTarget> {
  const parent = DropParent.innermost(
    document,
    heldName,
    namesToRoot(event.target),
  );
  return Option.map(Option.flatMap(parent, measureZone), (zone) =>
    DropZone.targetAt(zone, pointerOf(event)),
  );
}

/** ノードを掴む側（artboard の枠）へ渡す props。 */
export type NodeGrabHandlers = Readonly<{
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
}>;

/** 運んでいる間のポインタを追う側（artboard の並び）へ渡す props。 */
export type NodeDragHandlers = Readonly<{
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
}>;

export type NodeDragControl = Readonly<{
  drag: NodeDrag;
  grabHandlers: NodeGrabHandlers;
  dragHandlers: NodeDragHandlers;
  /** ドラッグ直後の `click` を飲み込む。飲み込んだ（＝選択に使わない）なら `true`。 */
  consumeClick: () => boolean;
}>;

/**
 * キャンバス上のドラッグを「ツリー内の移動」として解釈する
 * （docs/06-ui.md「キャンバス直接操作」/ docs/02-data-model.md「基本原則」）。
 *
 * このフックが持つのは DOM の実測とイベントの仲介だけで、
 * 「どこへ落ちるか」「いつドラッグとみなすか」の判定は `node-drop` / `node-drag` にある。
 *
 * ポインタキャプチャを使わないのは、捕捉すると以後のイベントの `target` が捕捉した要素に
 * 固定され、「今どのノードの上にいるか」を読めなくなるため。代わりに掴んだあとの
 * ポインタは artboard の並び全体で受け、そこから出たらドラッグを取り消す。
 */
export function useNodeDrag(
  params: Readonly<{
    document: DesignDocument;
    onMove: (name: string, to: ChildPosition) => void;
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
    dispatch({ type: "grab", name: name.value, origin: pointerOf(event) });
  };

  const trackPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const held = NodeDrag.heldName(drag);
    if (!held.some) {
      return;
    }
    dispatch({
      type: "move",
      pointer: pointerOf(event),
      drop: dropTargetAt(params.document, held.value, event),
    });
  };

  /** 離した時点で提示していた位置へ落とす（最後に届いた移動が決めた先）。 */
  const release = () => {
    const held = NodeDrag.heldName(drag);
    const target = NodeDrag.dropTarget(drag);
    if (held.some && target.some) {
      params.onMove(held.value, target.value.position);
    }
    dispatch({ type: "release" });
  };

  return {
    drag,
    grabHandlers: { onPointerDown: grab },
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

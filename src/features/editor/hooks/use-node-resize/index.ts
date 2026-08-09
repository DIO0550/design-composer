import { type PointerEvent as ReactPointerEvent, useReducer } from "react";
import type { AxisLength } from "@/domains/axis-length";
import type {
  CanvasOffset,
  CanvasView,
} from "@/features/editor/domains/canvas-view";
import type { EditorState } from "@/features/editor/domains/editor-state";
import { CanvasBounds } from "@/features/editor/domains/node-drop";
import { NodeResize } from "@/features/editor/domains/node-resize";
import { CanvasPointer } from "@/features/editor/utils/CanvasPointer";
import { CanvasDom } from "@/libs/canvas-dom";
import { Option } from "@/utils/Option";

/** リサイズの進み方（docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。 */
type NodeResizeAction =
  | Readonly<{ type: "grab"; handle: AxisLength; origin: CanvasOffset }>
  | Readonly<{ type: "release" }>
  | Readonly<{ type: "cancel" }>
  | Readonly<{ type: "consume_click" }>;

/** アクションの解釈だけを行い、状態の組み立ては NodeResize に委ねる。 */
function nodeResizeReducer(
  resize: NodeResize,
  action: NodeResizeAction,
): NodeResize {
  switch (action.type) {
    case "grab":
      return NodeResize.grab(action.handle, action.origin);
    case "release":
      return NodeResize.release(resize);
    case "cancel":
    case "consume_click":
      // 掴んだものを手放して最初の状態へ戻す（取り消しも、click を飲み込んだあとも同じ）。
      return NodeResize.create();
  }
}

/** 選択中のものが今どこにどれだけの大きさで描かれているか。 */
function selectionBounds(state: EditorState): Option<CanvasBounds> {
  return Option.map(
    Option.flatMap(state.selectedName, CanvasDom.elementOf),
    CanvasBounds.ofElement,
  );
}

/** 運んでいる間のポインタを追う側（artboard の並び）へ渡す props。 */
export type NodeResizeHandlers = Readonly<{
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
}>;

/** リサイズ中の状態と、ハンドルへ渡すハンドラ。 */
export type NodeResizeControl = Readonly<{
  /** 押された位置がハンドルなら掴む。掴んだ（＝移動のドラッグに渡さない）なら `true`。 */
  grabHandle: (event: ReactPointerEvent<HTMLElement>) => boolean;
  dragHandlers: NodeResizeHandlers;
  /** リサイズ直後の `click` を飲み込む。飲み込んだ（＝選択に使わない）なら `true`。 */
  consumeClick: () => boolean;
}>;

/**
 * キャンバス上のハンドルのドラッグを「大きさの変更」として解釈する
 * （docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。
 *
 * このフックが持つのは DOM の実測とイベントの仲介だけで、
 * 「どこを掴めるか」「どれだけの長さになるか」の判定は `node-resize` にある。
 *
 * ドラッグ（移動）と同じ状態機械にしないのは、移動と大きさの変更が別の編集であり、
 * 同時に起きないことは押した時点の順序（先にハンドルを試す）で決まるため。
 */
export function useNodeResize(
  params: Readonly<{
    state: EditorState;
    view: CanvasView;
    onResize: (size: AxisLength) => void;
  }>,
): NodeResizeControl {
  const [resize, dispatch] = useReducer(
    nodeResizeReducer,
    undefined,
    NodeResize.create,
  );

  const grabHandle = (event: ReactPointerEvent<HTMLElement>): boolean => {
    const bounds = selectionBounds(params.state);
    if (!bounds.some) {
      return false;
    }
    const handle = NodeResize.handleAt(
      NodeResize.handles(params.state),
      bounds.value,
      CanvasPointer.offsetOf(event),
    );
    if (!handle.some) {
      return false;
    }
    dispatch({
      type: "grab",
      handle: handle.value,
      origin: CanvasPointer.offsetOf(event),
    });
    return true;
  };

  /*
   * 掴んでいる間はポインタが動くたびにドキュメントへ反映する。長さは常に
   * 「掴んだ時点の長さ + 掴んでからの移動量」なので、反映が 1 回落ちても値はずれない。
   */
  const trackPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const length = NodeResize.lengthAt(
      resize,
      CanvasPointer.offsetOf(event),
      params.view,
    );
    if (!length.some) {
      return;
    }
    params.onResize(length.value);
  };

  return {
    grabHandle,
    dragHandlers: {
      onPointerMove: trackPointer,
      onPointerUp: () => dispatch({ type: "release" }),
      onPointerLeave: () => dispatch({ type: "cancel" }),
    },
    consumeClick: () => {
      if (!NodeResize.consumesClick(resize)) {
        return false;
      }
      dispatch({ type: "consume_click" });
      return true;
    },
  };
}

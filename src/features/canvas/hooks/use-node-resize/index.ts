import { type PointerEvent as ReactPointerEvent, useReducer } from "react";
import type { AxisLength } from "@/domains/dcmp/axis-length";
import { DocumentSelection } from "@/domains/session/document-selection";
import type { Axis } from "@/domains/unit/axis";
import type { Offset } from "@/domains/unit/offset";
import type { CanvasView } from "@/features/canvas/domains/canvas-view";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { NodeResize } from "@/features/canvas/domains/node-resize";
import { CanvasPointer } from "@/features/canvas/utils/CanvasPointer";
import { DrawnBounds } from "@/features/canvas/utils/DrawnBounds";
import { Option } from "@/utils/Option";

/** リサイズの進み方（docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。 */
type NodeResizeAction =
  | Readonly<{ type: "grab"; handle: AxisLength; origin: Offset }>
  | Readonly<{ type: "release" }>
  | Readonly<{ type: "cancel" }>
  | Readonly<{ type: "consume_click" }>;

/**
 * アクションの解釈だけを行い、状態の組み立ては NodeResize に委ねる。
 *
 * @param resize 今のリサイズの状態
 * @param action 解釈するアクション
 * @returns 遷移後のリサイズの状態
 */
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

/**
 * 選択中のものが今どこにどれだけの大きさで描かれているか。
 *
 * ハンドルを描く側（`useDrawnBounds`）が持つスナップショットを使い回さず、押した
 * 瞬間に測り直す。スナップショットは再レンダーのたびにしか更新されないので、
 * 再レンダーを伴わない位置変化があると掴める帯だけがずれる。
 *
 * @param selection 選択とドキュメントの出どころになる対
 * @returns 描かれている矩形。未選択と、まだ画面に出ていないときは `none`
 */
function selectionBounds(selection: DocumentSelection): Option<CanvasBounds> {
  return Option.flatMap(
    DocumentSelection.singleName(selection),
    DrawnBounds.measure,
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
  /** 押された位置が掴める帯なら掴む。掴んだ（＝移動のドラッグに渡さない）なら `true`。 */
  grabAt: (event: ReactPointerEvent<HTMLElement>) => boolean;
  /**
   * 押されたハンドルの軸をそのまま掴む。帯の当たり判定は通らない
   * （ハンドルは辺をまたいで置かれるので、外半分は要素の矩形の外にある）。
   */
  grab: (handle: AxisLength, event: ReactPointerEvent<HTMLElement>) => void;
  /**
   * 掴んで動かしている軸。ハンドルを透明にするかと、その間のカーソルを決める。
   */
  grabbedAxis: Option<Axis>;
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
 *
 * @param params ハンドルの位置を決める `selection` と `view`、
 *   大きさが確定したときに呼ぶ `onResize`
 * @returns ハンドルを掴む手続きと、ポインタを追うハンドラ・`click` を飲み込む手続き
 */
export function useNodeResize(
  params: Readonly<{
    selection: DocumentSelection;
    view: CanvasView;
    onResize: (size: AxisLength) => void;
  }>,
): NodeResizeControl {
  const [resize, dispatch] = useReducer(
    nodeResizeReducer,
    undefined,
    NodeResize.create,
  );

  const grab = (
    handle: AxisLength,
    event: ReactPointerEvent<HTMLElement>,
  ): void => {
    dispatch({ type: "grab", handle, origin: CanvasPointer.offsetOf(event) });
  };

  const grabAt = (event: ReactPointerEvent<HTMLElement>): boolean => {
    const bounds = selectionBounds(params.selection);
    if (!bounds.some) {
      return false;
    }
    const handle = NodeResize.handleAt(
      NodeResize.handles(params.selection),
      bounds.value,
      CanvasPointer.offsetOf(event),
    );
    if (!handle.some) {
      return false;
    }
    grab(handle.value, event);
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
    grabAt,
    grab,
    grabbedAxis: NodeResize.grabbedAxis(resize),
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

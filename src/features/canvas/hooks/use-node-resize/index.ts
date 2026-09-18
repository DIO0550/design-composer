import {
  type PointerEvent as ReactPointerEvent,
  useReducer,
  useRef,
} from "react";
import type { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { DocumentSelection } from "@/domains/session/document-selection";
import {
  EditContinuities,
  type EditContinuity,
} from "@/domains/session/edit-continuity";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import type { CanvasView } from "@/features/canvas/domains/canvas-view";
import {
  NodeResize,
  type ResizableSelection,
  type ResizeGrip,
  type ResizeHold,
} from "@/features/canvas/domains/node-resize";
import { CanvasPointer } from "@/features/canvas/utils/CanvasPointer";
import { DrawnBounds } from "@/features/canvas/utils/DrawnBounds";
import { Option } from "@/utils/Option";

/** リサイズの進み方（docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。 */
type NodeResizeAction =
  | Readonly<{ type: "grab"; held: ResizeHold }>
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
      return NodeResize.grab(action.held);
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
   * 押されたハンドルで掴めるものをそのまま掴む。帯の当たり判定は通らない
   * （ハンドルは辺をまたいで置かれるので、外半分は要素の矩形の外にある）。
   */
  grab: (grip: ResizeGrip, event: ReactPointerEvent<HTMLElement>) => void;
  /**
   * 掴んで動かしているもの。ハンドルを透明にするかと、その間のカーソルを決める。
   */
  grabbed: Option<ResizeHold>;
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
 * @param params 掴める軸と位置を持つ `resizable`、実測に使う `selection`、倍率の `view`、
 *   大きさが確定したときに呼ぶ `onResize`
 * @returns ハンドルを掴む手続きと、ポインタを追うハンドラ・`click` を飲み込む手続き
 */
export function useNodeResize(
  params: Readonly<{
    resizable: ResizableSelection;
    selection: DocumentSelection;
    view: CanvasView;
    onResize: (edit: ResizeEdit, continuity: EditContinuity) => void;
  }>,
): NodeResizeControl {
  const [resize, dispatch] = useReducer(
    nodeResizeReducer,
    undefined,
    NodeResize.create,
  );
  /*
   * この掴みで既に 1 回反映したか。掴むたびに戻す。
   *
   * reducer の状態に持たないのは、`trackPointer` が読むのが**今のレンダーの値**だから。
   * pointermove は同期フラッシュが保証されず、続けて 2 回処理されると 2 回とも「まだ
   * 反映していない」と読んで undo が 2 回に割れる（happy-dom は毎回フラッシュするので
   * テストには出ない）。render では読まずハンドラの中だけで読み書きするので ref に置く
   * （rules/hooks.md「useRef の使い分け」）。
   *
   * 立てるのは通知した時点で、履歴へ入ったかは見ない。1 件目が上流で落ちると 2 件目が
   * 続きとして届く（`EditHistory.amend` の doc が書いている「戻る先が無いまま」と同じ形）。
   */
  const hasResized = useRef(false);

  const grab = (
    grip: ResizeGrip,
    event: ReactPointerEvent<HTMLElement>,
  ): void => {
    hasResized.current = false;
    dispatch({
      type: "grab",
      held: NodeResize.hold(
        params.resizable,
        grip,
        CanvasPointer.offsetOf(event),
      ),
    });
  };

  const grabAt = (event: ReactPointerEvent<HTMLElement>): boolean => {
    const bounds = selectionBounds(params.selection);
    if (!Option.isSome(bounds)) {
      return false;
    }
    const grabbed = NodeResize.grabAt(
      params.resizable,
      bounds.value,
      CanvasPointer.offsetOf(event),
    );
    if (!Option.isSome(grabbed)) {
      return false;
    }
    hasResized.current = false;
    dispatch({ type: "grab", held: grabbed.value });
    return true;
  };

  /*
   * 掴んでいる間はポインタが動くたびにドキュメントへ反映する。長さも位置も常に
   * 「掴んだ時点の値 + 掴んでからの移動量」なので、反映が 1 回落ちても値はずれない。
   *
   * 2 件目以降を続きとして渡すことで、掴んでから離すまでが undo 1 回ぶんになる
   * （docs/06-ui.md「リサイズハンドル」）。
   */
  const trackPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const edit = NodeResize.editAt(
      resize,
      CanvasPointer.offsetOf(event),
      params.view,
    );
    if (!Option.isSome(edit)) {
      return;
    }
    const continuity = hasResized.current
      ? EditContinuities.Continued
      : EditContinuities.Separate;
    hasResized.current = true;
    params.onResize(edit.value, continuity);
  };

  return {
    grabAt,
    grab,
    grabbed: NodeResize.grabbed(resize),
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

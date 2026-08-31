import { type PointerEvent as ReactPointerEvent, useReducer } from "react";
import type { Offset } from "@/domains/unit/offset";
import {
  ArtboardDrag,
  type ArtboardDragPreview,
} from "@/features/canvas/domains/artboard-drag";
import type { CanvasView } from "@/features/canvas/domains/canvas-view";
import { CanvasPointer } from "@/features/canvas/utils/CanvasPointer";
import type { Option } from "@/utils/Option";

/** ドラッグの状態を進める指示。 */
type ArtboardDragAction =
  | Readonly<{
      type: "grab";
      name: string;
      grabbedAt: Offset;
      pointerOrigin: Offset;
    }>
  | Readonly<{ type: "move"; pointer: Offset }>
  | Readonly<{ type: "release" }>;

/**
 * ドラッグの状態遷移。判定は `ArtboardDrag` が持つので、ここは指示を配るだけ。
 *
 * @param drag 今の状態
 * @param action 進める指示
 * @returns 進めたあとの状態
 */
function artboardDragReducer(
  drag: ArtboardDrag,
  action: ArtboardDragAction,
): ArtboardDrag {
  switch (action.type) {
    case "grab":
      return ArtboardDrag.grab({
        name: action.name,
        grabbedAt: action.grabbedAt,
        pointerOrigin: action.pointerOrigin,
      });
    case "move":
      return ArtboardDrag.moveTo(drag, action.pointer);
    case "release":
      return ArtboardDrag.release();
  }
}

/** artboard を掴む側（見出し）と、ポインタを追う側（キャンバス）へ渡すもの。 */
export type ArtboardDragControl = Readonly<{
  /** 見出しを押したときに掴む。掴んだ時点の描画位置を起点にする。 */
  grab: (
    name: string,
    grabbedAt: Offset,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
  dragHandlers: Readonly<{
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: () => void;
  }>;
  /** 運んでいる間の見せかけの位置。離すまで確定しないので描く側だけが使う。 */
  preview: Option<ArtboardDragPreview>;
}>;

/**
 * キャンバス上の artboard のドラッグを「キャンバス上の移動」として解釈する
 * （docs/06-ui.md「キャンバス直接操作」の artboard の移動）。
 *
 * ノードのドラッグ（`useNodeDrag`）と分けているのは、artboard の移動がツリーの操作では
 * ないため（判断は `ArtboardDrag` の doc）。
 *
 * 運んでいる間はドキュメントを書き換えず、離したときに 1 回だけ編集を送る。
 * 毎回書き換えると undo 履歴がドラッグの回数だけ積まれるため。運んでいる間の
 * 見た目は `preview` を描く側が使う。
 *
 * @param params 倍率を引く表示の状態と、離したときに編集を送る先
 * @returns 掴む手続きと、ポインタを追うハンドラ、運んでいる間の見せかけの位置
 */
export function useArtboardDrag(
  params: Readonly<{
    view: CanvasView;
    onReposition: (name: string, canvasPosition: Offset) => void;
  }>,
): ArtboardDragControl {
  const [drag, dispatch] = useReducer(
    artboardDragReducer,
    undefined,
    ArtboardDrag.create,
  );

  const preview = ArtboardDrag.preview(drag, params.view);

  return {
    grab: (name, grabbedAt, event) => {
      /*
       * ポインタを捕捉して、キャンバスの外まで引いてもドラッグが続くようにする
       * （原点より左・上へ運ぶと、器の外へ出る）。パン（`useCanvasView`）と同じ形。
       * 解放は `pointerup` で暗黙に行われるので、離す側では触らない。
       */
      event.currentTarget.setPointerCapture(event.pointerId);
      dispatch({
        type: "grab",
        name,
        grabbedAt,
        pointerOrigin: CanvasPointer.offsetOf(event),
      });
    },
    dragHandlers: {
      onPointerMove: (event) => {
        dispatch({ type: "move", pointer: CanvasPointer.offsetOf(event) });
      },
      onPointerUp: () => {
        if (preview.some) {
          params.onReposition(preview.value.name, preview.value.canvasPosition);
        }
        dispatch({ type: "release" });
      },
    },
    preview,
  };
}

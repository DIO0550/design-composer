import { type PointerEvent as ReactPointerEvent, useReducer } from "react";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Offset } from "@/domains/unit/offset";
import {
  ArtboardDrag,
  type ArtboardDragPreview,
  type ArtboardPointerMove,
  type ArtboardSnapMeasure,
} from "@/features/editor/features/canvas/domains/artboard-drag";
import type { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { CanvasPointer } from "@/features/editor/features/canvas/utils/CanvasPointer";
import { DrawnBounds } from "@/features/editor/features/canvas/utils/DrawnBounds";
import { Option } from "@/utils/Option";

/** ドラッグの状態を進める指示。 */
type ArtboardDragAction =
  | Readonly<{
      type: "grab";
      name: string;
      grabbedAt: Offset;
      pointerOrigin: Offset;
    }>
  | Readonly<{ type: "move"; move: ArtboardPointerMove }>
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
      return ArtboardDrag.moveTo(drag, action.move);
    case "release":
      return ArtboardDrag.release();
  }
}

/**
 * 掴んでいる artboard と、揃え先になる他の artboard の実測。
 *
 * @param document artboard の並びの引き先
 * @param carriedName 運んでいる artboard の名前
 * @returns 実測。運んでいる artboard がまだ描かれていなければ `none`
 */
function measureDrawn(
  document: DesignDocument,
  carriedName: string,
): Option<ArtboardSnapMeasure> {
  // 自身を揃え先に入れると、自分の辺との距離（＝前回からの移動量）へ常に寄って動かなくなる
  const others = DesignDocument.collectArtboardNames(document).filter(
    (name) => name !== carriedName,
  );
  return Option.map(DrawnBounds.measure(carriedName), (carried) => ({
    carried,
    stationary: DrawnBounds.collectDrawnBounds(others),
  }));
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
 * 運んでいる間はドキュメントを書き換えず、離したときに 1 回だけ編集を送る。運んでいる間の
 * 見た目は `preview` を描く側が使う。他の artboard の辺か中心線の近くでは吸い付く（どれだけ
 * 寄せるかは `ArtboardDrag.snapOffsetAt`。ここが持つのは実測だけ）。
 *
 * @param params 揃え先の artboard の並びを引く `document`、倍率を引く表示の状態と、
 *   離したときに編集を送る先
 * @returns 掴む手続きと、ポインタを追うハンドラ、運んでいる間の見せかけの位置
 */
export function useArtboardDrag(
  params: Readonly<{
    document: DesignDocument;
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
        const pointer = CanvasPointer.offsetOf(event);
        /*
         * 判定に渡すのは閉包の `drag`（実測した DOM を描いたときの状態）。掴んでいない間は
         * 測らない（ポインタが器の上を通るたびに全 artboard を測ることになる）。
         */
        const drawn = Option.flatMap(ArtboardDrag.grabbed(drag), (grab) =>
          measureDrawn(params.document, grab.name),
        );
        const snap = Option.isSome(drawn)
          ? ArtboardDrag.snapOffsetAt(drag, pointer, drawn.value)
          : Offset.Origin;
        dispatch({ type: "move", move: { pointer, snap } });
      },
      onPointerUp: () => {
        if (Option.isSome(preview)) {
          params.onReposition(preview.value.name, preview.value.canvasPosition);
        }
        dispatch({ type: "release" });
      },
    },
    preview,
  };
}

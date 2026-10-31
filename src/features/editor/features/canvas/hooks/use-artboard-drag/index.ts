import { type PointerEvent as ReactPointerEvent, useReducer } from "react";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { Offset } from "@/domains/unit/offset";
import {
  ArtboardDrag,
  type ArtboardDragPreview,
  type ArtboardPointerMove,
  type ArtboardRepositionMeasure,
} from "@/features/editor/features/canvas/domains/artboard-drag";
import type { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import type { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import { RepositionLines } from "@/features/editor/features/canvas/domains/reposition-lines";
import type { SnapGuides } from "@/features/editor/features/canvas/domains/side-snap";
import { CanvasPointer } from "@/features/editor/features/canvas/utils/CanvasPointer";
import { DrawnBounds } from "@/features/editor/features/canvas/utils/DrawnBounds";
import { AltKey, CommandKey } from "@/libs/dom-event";
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
 * 吸い付く先・距離を測る相手になる artboard の名前。運んでいる artboard 以外のすべてを、
 * ドキュメントの並び順で返す。
 *
 * @param document artboard の並びの引き先
 * @param carriedName 運んでいる artboard の名前
 * @returns 吸い付く先・距離を測る相手の名前の並び
 */
function collectOtherNames(
  document: DesignDocument,
  carriedName: string,
): readonly string[] {
  // 自身を揃え先に入れると、自分の辺との距離（＝前回からの移動量）へ常に寄って動かなくなる
  return DesignDocument.collectArtboardNames(document).filter(
    (name) => name !== carriedName,
  );
}

/**
 * 掴んでいる artboard と、他の artboard の実測。
 *
 * @param carriedName 運んでいる artboard の名前
 * @param otherNames 吸い付く先・距離の相手として測る artboard の名前の並び
 * @returns 実測。運んでいる artboard がまだ描かれていなければ `none`
 */
function measureDrawn(
  carriedName: string,
  otherNames: readonly string[],
): Option<ArtboardRepositionMeasure> {
  return Option.map(DrawnBounds.measure(carriedName), (carried) => ({
    carried,
    others: DrawnBounds.collectDrawnBounds(otherNames),
  }));
}

/** artboard を掴む側（見出し）と、ポインタを追う側（キャンバス）と、運んでいる間の線を描く側へ渡すもの。 */
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
  /**
   * 運んでいる間に揃った線と、揃え先との隙間（Alt / Option の距離と同じ線上に重なる隙間は
   * 除く）。離すと出なくなる。
   */
  snapGuides: SnapGuides;
  /**
   * 運んでいる間に Alt / Option を押していれば出す、他の artboard までの距離。離すと出なくなる。
   */
  facingDistances: FacingDistances;
}>;

/**
 * キャンバス上の artboard のドラッグを「キャンバス上の移動」として解釈する
 * （docs/06-ui.md「キャンバス直接操作」の artboard の移動）。
 *
 * 運んでいる間はドキュメントを書き換えず、離したときに 1 回だけ編集を送る。運んでいる間の
 * 見た目は `preview` を描く側が使う。他の artboard の辺か中心線の近くでは吸い付く（どれだけ
 * 寄せてどこに線を出すかは `ArtboardDrag.snappedAt`。ここが持つのは実測だけ）。⌘ / Ctrl を
 * 押しながら動かしたときは吸い付かず、揃ったガイド線も出ない（押しているかはポインタが動くたびに見る）。
 * Alt / Option を押しながら動かしている間は、上下左右それぞれで最初に当たる他の artboard までの
 * 距離を出す（押しているかはポインタが動くたびに見る）。
 *
 * @param params 揃え先の artboard の並びを引く `document`、倍率を引く表示の状態と、
 *   離したときに編集を送る先
 * @returns 掴む手続きと、ポインタを追うハンドラ、運んでいる間の見せかけの位置と、揃った線に
 *   引く線と、揃え先との隙間と、Alt / Option の距離
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
       * （原点より左・上へ運ぶと、器の外へ出る）。捕捉するのは押した見出しそのもの。
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
         *
         * ⌘ / Ctrl を押していても他の artboard は測る。同じ実測を距離の相手にも使うため（吸い付かない
         * ことは `snaps` で表し、測れない（`none`）とは分ける）。
         */
        const drawn = Option.flatMap(ArtboardDrag.grabbed(drag), (grab) =>
          measureDrawn(
            grab.name,
            collectOtherNames(params.document, grab.name),
          ),
        );
        const input = {
          pointer,
          snaps: !CommandKey.isHeld(event),
          measuresDistances: AltKey.isHeld(event),
        };
        const snapped = Option.isSome(drawn)
          ? ArtboardDrag.snappedAt(drag, input, drawn.value)
          : RepositionLines.Unsnapped;
        dispatch({ type: "move", move: { pointer, snapped } });
      },
      onPointerUp: () => {
        if (Option.isSome(preview)) {
          params.onReposition(preview.value.name, preview.value.canvasPosition);
        }
        dispatch({ type: "release" });
      },
    },
    preview,
    snapGuides: ArtboardDrag.snapGuides(drag),
    facingDistances: ArtboardDrag.facingDistances(drag),
  };
}

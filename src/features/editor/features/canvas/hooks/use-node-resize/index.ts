import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useReducer,
} from "react";
import type { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { DocumentSelection } from "@/domains/session/document-selection";
import {
  type EditContinuity,
  EditContinuityRun,
} from "@/domains/session/edit-continuity";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import type { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import type { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import {
  NodeResize,
  type ResizableSelection,
  type ResizeGrip,
  type ResizeHold,
  type ResizeLines,
} from "@/features/editor/features/canvas/domains/node-resize";
import type { SnapGuides } from "@/features/editor/features/canvas/domains/side-snap";
import { CanvasPointer } from "@/features/editor/features/canvas/utils/CanvasPointer";
import { DrawnBounds } from "@/features/editor/features/canvas/utils/DrawnBounds";
import { useFirstThenRest } from "@/hooks/use-first-then-rest";
import { AltKey, CommandKey } from "@/libs/dom-event";
import { Option } from "@/utils/Option";

/** リサイズの進み方（docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。 */
type NodeResizeAction =
  | Readonly<{ type: "grab"; held: ResizeHold }>
  | Readonly<{ type: "track"; lines: ResizeLines }>
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
    case "track":
      return NodeResize.withLines(resize, action.lines);
    case "release":
      return NodeResize.release(resize);
    case "cancel":
    case "consume_click":
      // 掴んだものを手放して最初の状態へ戻す（取り消しも、click を飲み込んだあとも同じ）。
      return NodeResize.create();
  }
}

/**
 * 選択中のものが今どこにどれだけの大きさで描かれているか（軸に平行な外接矩形。掴んだ時点の
 * 実測に載せる）。
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

/**
 * 掴んだものに、掴んだ時点の実測を載せる（docs/06-ui.md「リサイズハンドル」の辺のスナップと
 * Alt / Option の距離）。揃え先と距離の相手を決めるのは `NodeResize.resizable` と
 * `NodeResize.hold`、ここは実測だけ。
 *
 * @param held 掴んだもの。揃え先と距離の相手の名前（`targetNames`）を持つ
 * @param grabbed 選択中のものが掴んだ時点に描かれている矩形
 * @returns 揃え先と距離の相手の実測を載せた掴み
 */
function withMeasuredTargets(
  held: ResizeHold,
  grabbed: CanvasBounds,
): ResizeHold {
  return NodeResize.withMeasured(held, {
    grabbed,
    measure: DrawnBounds.measureWithArea,
  });
}

/** 運んでいる間のポインタを追う側（artboard の並びを包む `canvas-content`）へ渡す props。 */
export type NodeResizeHandlers = Readonly<{
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
}>;

/**
 * リサイズ中の状態と、ハンドル・キャンバスの面へ渡すハンドラ。
 *
 * `onClickCapture` は `dragHandlers` に入れない（`useNodeDrag` / `useRangeSelect` とは
 * 形が違う）。付け先が `dragHandlers` と違い、ハンドルと土台をともに含む器になるため
 * （理由は付け先の `ArtboardCanvas` が持つ）。
 */
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
  /** 掴んだ辺が揃った線（docs/06-ui.md「リサイズハンドル」の辺のスナップ）。 */
  snapGuides: SnapGuides;
  /** 掴んだ辺から外への Alt / Option の距離（docs/06-ui.md「リサイズハンドル」）。 */
  facingDistances: FacingDistances;
  dragHandlers: NodeResizeHandlers;
  /** リサイズ直後の `click` を飲み込む（選択に使わせない / `NodeResize` の `resized`）。 */
  onClickCapture: (event: ReactMouseEvent<HTMLElement>) => void;
}>;

/**
 * キャンバス上のハンドルのドラッグを「大きさの変更」として解釈する
 * （docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。
 *
 * このフックが持つのは DOM の実測とイベントの仲介だけで、
 * 「どこを掴めるか」「どれだけの長さになるか」の判定は `node-resize` にある。
 * ⌘ / Ctrl を押している間に揃え先を外す（吸い付かせない）のと、Alt / Option を押していない
 * 間に距離の相手を外すのは、修飾キーという入力の事情なのでこちらが持つ。
 *
 * @param params 掴める軸と位置を持つ `resizable`、実測に使う `selection`、倍率の `view`、
 *   大きさが確定したときに呼ぶ `onResize`
 * @returns ハンドルを掴む手続きと、ポインタを追うハンドラ・`click` を飲み込むハンドラ
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
  // reducer の状態に持たないのは、pointermove が同期フラッシュされず今のレンダーの値を読むと
  // 2 回とも 1 件目になるため（happy-dom は毎回フラッシュするのでテストには出ない）。
  // 単一選択でない・ファイルが不正な間に 1 件目が上流で落ちると、2 件目が続きとして届く
  // （`EditHistory.amend` の doc が書いている「戻る先が無いまま」と同じ形）。
  const continuitySequence = useFirstThenRest(EditContinuityRun);

  const grab = (
    grip: ResizeGrip,
    event: ReactPointerEvent<HTMLElement>,
  ): void => {
    continuitySequence.restart();
    const held = NodeResize.hold(
      params.resizable,
      grip,
      CanvasPointer.offsetOf(event),
    );
    /*
     * ハンドルは測らなくても掴める。測れないときは吸い付かず距離も出ないだけで、掴むことは止めない。
     * 大きさの無い実測は原点に返るので、そこから行き先を作ると関係の無い辺へ吸い付く
     * （帯の経路は `grabAt` の当たり判定で弾かれる）。
     */
    const bounds = Option.flatMap(selectionBounds(params.selection), (drawn) =>
      CanvasBounds.hasArea(drawn) ? Option.some(drawn) : Option.none,
    );
    dispatch({
      type: "grab",
      held: Option.isSome(bounds)
        ? withMeasuredTargets(held, bounds.value)
        : held,
    });
  };

  const grabAt = (event: ReactPointerEvent<HTMLElement>): boolean => {
    const bounds = selectionBounds(params.selection);
    const rotated = Option.flatMap(
      DocumentSelection.singleName(params.selection),
      (name) =>
        DrawnBounds.measureRotated(
          name,
          params.resizable.rotation.total,
          params.view,
        ),
    );
    // 名前を付けた変数にすると narrowing が効かないので、条件はここへ直に書く
    if (!Option.isSome(bounds) || !Option.isSome(rotated)) {
      return false;
    }
    const grabbed = NodeResize.grabAt(
      params.resizable,
      rotated.value,
      CanvasPointer.offsetOf(event),
    );
    if (!Option.isSome(grabbed)) {
      return false;
    }
    continuitySequence.restart();
    dispatch({
      type: "grab",
      held: withMeasuredTargets(grabbed.value, bounds.value),
    });
    return true;
  };

  /*
   * 掴んでいる間はポインタが動くたびにドキュメントへ反映する。長さも位置も常に
   * 「掴んだ時点の値 + 掴んでからの移動量」なので、反映が 1 回落ちても値はずれない。
   *
   * 2 件目以降を続きとして渡すことで、掴んでから離すまでが undo 1 回ぶんになる
   * （docs/06-ui.md「リサイズハンドル」）。
   *
   * ⌘ / Ctrl を押している移動では揃え先を外してから通す。Alt / Option を押していない移動では
   * 距離の相手を外してから通す。外した値は状態へ書き戻さないので、キーを変えて動かし直せば
   * 同じ掴みのまま再び吸い付く / 距離が出る。状態へ書き戻すのはガイド線と距離だけ。
   *
   * 編集の通知とガイド線・距離の dispatch を続けて行うが、更新先の持ち主が違う（編集は
   * ドキュメント、ガイド線と距離はこのフックの状態）ので、1 つの state にはまとめない。
   */
  const trackPointer = (event: ReactPointerEvent<HTMLElement>) => {
    const snapDecided = CommandKey.isHeld(event)
      ? NodeResize.withoutSnapTargets(resize)
      : resize;
    const tracked = NodeResize.trackedAt(
      AltKey.isHeld(event)
        ? snapDecided
        : NodeResize.withoutDistanceTargets(snapDecided),
      CanvasPointer.offsetOf(event),
      params.view,
    );
    if (!Option.isSome(tracked)) {
      return;
    }
    params.onResize(tracked.value.edit, continuitySequence.next());
    dispatch({
      type: "track",
      lines: {
        guides: tracked.value.guides,
        distanceLines: tracked.value.distanceLines,
      },
    });
  };

  return {
    grabAt,
    grab,
    grabbed: NodeResize.grabbed(resize),
    snapGuides: NodeResize.snapGuides(resize),
    facingDistances: NodeResize.facingDistances(resize),
    dragHandlers: {
      onPointerMove: trackPointer,
      onPointerUp: () => dispatch({ type: "release" }),
      onPointerLeave: () => dispatch({ type: "cancel" }),
    },
    onClickCapture: (event) => {
      if (!NodeResize.consumesClick(resize)) {
        return;
      }
      event.stopPropagation();
      dispatch({ type: "consume_click" });
    },
  };
}

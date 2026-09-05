import { type PointerEvent as ReactPointerEvent, useReducer } from "react";
import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import type { ChildPlacement } from "@/domains/dcmp/child-placement";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { NodeTemplate } from "@/domains/session/node-template";
import { Offset } from "@/domains/unit/offset";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import {
  Carrying,
  DropEdit,
  type Grab,
  NodeDrag,
} from "@/features/canvas/domains/node-drag";
import {
  CanvasBounds,
  type DraggedNode,
  DropParent,
  DropZone,
} from "@/features/canvas/domains/node-drop";
import {
  type ParentShift,
  RepositionTarget,
} from "@/features/canvas/domains/reposition-target";
import { CanvasPointer } from "@/features/canvas/utils/CanvasPointer";
import { CanvasDom } from "@/libs/canvas-dom";
import { ElementEx } from "@/utils/ElementEx";
import { Option } from "@/utils/Option";

/** ドラッグの進み方（docs/06-ui.md「キャンバス直接操作」の移動・座標の置き直しと、挿入）。 */
type NodeDragAction =
  | Readonly<{ type: "grab"; grab: Grab }>
  | Readonly<{ type: "move"; pointer: Offset; carrying: Carrying }>
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
      return NodeDrag.moveTo(drag, action.pointer, action.carrying);
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

/** 落とし方を決めるのに要るもの（今の掴みと、それを解釈するための材料）。 */
type DropContext = Readonly<{
  document: DesignDocument;
  grab: Grab;
  view: CanvasView;
  event: ReactPointerEvent<HTMLElement>;
}>;

/**
 * 描かれている要素の矩形。
 *
 * @param name 描かれている artboard / ノードの名前
 * @returns その矩形。画面に無ければ `none`
 */
function boundsOf(name: string): Option<CanvasBounds> {
  return Option.map(CanvasDom.elementOf(name), CanvasBounds.ofElement);
}

/**
 * 落とし先の親と、今の親の左上から見たその左上のずれ。
 *
 * 親の矩形はドキュメントに書かれていない（`hug` / `fill` があるので、大きさも位置も
 * レイアウトを通すまで決まらない）ため、実測でしか決められない。倍率は
 * `transform` で効いており実測値に乗るので、ドキュメント上の px へ割り戻す。
 *
 * 落とし先が今の親と同じでも分岐しないのは、同じ要素を 2 回測ればずれが厳密に 0 に
 * なるため（＝親を付け替えない回は座標がそのまま書かれる）。
 *
 * @param view 実測値を割り戻すための今の表示
 * @param current 今の親の名前
 * @param dropped 落とし先の親の名前
 * @returns 落とし先の親と原点のずれ。どちらかが描かれていなければ `none`
 */
function parentShiftAt(
  view: CanvasView,
  current: string,
  dropped: string,
): Option<ParentShift> {
  const currentBounds = boundsOf(current);
  const droppedBounds = boundsOf(dropped);
  if (!currentBounds.some || !droppedBounds.some) {
    return Option.none;
  }
  return Option.some({
    name: dropped,
    shift: CanvasView.toDocumentOffset(
      view,
      CanvasBounds.originShift(currentBounds.value, droppedBounds.value),
    ),
  });
}

/**
 * 座標で運んでいるノードと、掴んだ時点でそれがいた親の中の座標。
 * **これがあることが「このドラッグは座標の置き直しになる」と同じ意味**になる
 * （パレットの雛形はまだ木に無く、フローのノードは座標を持たない）。
 */
type CarriedNode = Readonly<{ name: string; at: ChildPlacement }>;

/**
 * 今の掴みが座標のドラッグなら、運んでいるノードと今いる場所。
 *
 * @param document 配置の引き先になるドキュメント
 * @param dragged 運んでいるもの
 * @returns 運んでいるノードと今いる場所。雛形を運んでいる / 座標で動かせないノードを
 *   運んでいるなら `none`
 */
function carriedNode(
  document: DesignDocument,
  dragged: DraggedNode,
): Option<CarriedNode> {
  if (dragged.kind !== "existing") {
    return Option.none;
  }
  return Option.map(
    DesignDocument.childPlacementOf(document, dragged.name),
    (at) => ({ name: dragged.name, at }),
  );
}

/**
 * 掴んでいる絶対配置のノードを、今のポインタまで運んだときの運び方。
 *
 * 運んだ量は画面上の移動量を倍率で割り戻したもので（倍率を変えても掴んだ点に追従する）、
 * そこから書かれる座標と見た目のずらし量を決めるのは `RepositionTarget`。
 *
 * **落とせる親がポインタの下に無くても、見た目は追従させる**（ずらし量は原点の
 * 付け替えを含まないので親が決まらなくても決まる）。追従を止めると、キャンバスの余白へ
 * 一瞬寄っただけで元の位置へ戻り、運べているのか分からなくなる。
 *
 * @param context 今の掴みと、倍率・ポインタ
 * @param carried 運んでいるノードと、掴んだ時点の座標
 * @param parent ポインタの下で受け入れられる親
 * @returns 座標を置き直す運び方。親が無い / 親の矩形を実測できないときは見た目だけの運び方
 */
function repositionCarrying(
  context: DropContext,
  carried: CarriedNode,
  parent: Option<DropParent>,
): Carrying {
  const moved = CanvasView.toDocumentOffset(
    context.view,
    Offset.delta(context.grab.origin, CanvasPointer.offsetOf(context.event)),
  );
  const shift = Option.flatMap(parent, (dropped) =>
    parentShiftAt(context.view, carried.at.parentName, dropped.name),
  );
  if (!shift.some) {
    return Carrying.preview({
      name: carried.name,
      offset: RepositionTarget.carriedOffset(carried.at.placement, moved),
    });
  }
  return Carrying.droppable(
    DropEdit.reposition(
      carried.name,
      RepositionTarget.create(carried.at.placement, moved, shift.value),
    ),
  );
}

/**
 * 掴んでいるものを、今のポインタでツリーへ落とすときの運び方。
 * 実体は動かさず、落ちる先はドロップ線で見せる。
 *
 * @param context 今の掴みと、落とし先を決めるための材料
 * @param parent ポインタの下で受け入れられる親
 * @returns ツリーへ落とす運び方。親が無い / 帯を実測できないなら何も起きない運び方
 */
function intoTreeCarrying(
  context: DropContext,
  parent: Option<DropParent>,
): Carrying {
  const target = Option.flatMap(parent, (accepted) =>
    Option.map(measureZone(accepted), (zone) =>
      DropZone.targetAt(zone, CanvasPointer.offsetOf(context.event)),
    ),
  );
  return target.some
    ? Carrying.droppable(DropEdit.intoTree(context.grab.dragged, target.value))
    : Carrying.nothing();
}

/**
 * 今の運び方。
 * 絶対配置のノードを運んでいるなら座標の置き直し、そうでなければツリーへの移動・挿入。
 *
 * 受け入れられる親を先に 1 回だけ解決して両方へ渡すのは、どちらの運び方でも
 * 落ちる先の親が同じだから（2 回解決すると、同じ走査を 2 度行ううえに
 * 食い違う余地ができる）。
 *
 * **どちらの運び方になるかは運んでいるものだけで決まり、実測の成否では変わらない。**
 * 置き直しに決まったあとで実測に失敗したら、ツリーの移動へ落とさずそのまま
 * 「落とせない」にする（落とすと、座標を動かすつもりのドラッグが黙って木の並びを
 * 書き換える別の編集になる）。
 *
 * @param context 今の掴みと、落とし先を決めるための材料
 * @returns 今の運び方
 */
function carryingAt(context: DropContext): Carrying {
  const parent = DropParent.innermost(
    context.document,
    context.grab.dragged,
    namesToRoot(context.event.target),
  );
  const carried = carriedNode(context.document, context.grab.dragged);
  return carried.some
    ? repositionCarrying(context, carried.value, parent)
    : intoTreeCarrying(context, parent);
}

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
  /**
   * 押された位置にある既存ノードを掴む。
   *
   * @param event artboard の枠で受けた `pointerdown`
   * @returns 掴んだ（＝この先の判定へ渡さない）なら `true`。押された位置から根までに
   *   ドキュメントのノードが 1 つも無ければ `false`（artboard の背景を押したとき）
   */
  grabNode: (event: ReactPointerEvent<HTMLElement>) => boolean;
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
 * ノードの座標の置き直し（親をまたげば付け替え）として解釈する
 * （docs/06-ui.md「キャンバス直接操作」/ docs/02-data-model.md「基本原則」）。
 *
 * このフックが持つのは DOM の実測とイベントの仲介だけで、
 * 「どこへ落ちるか」「いつドラッグとみなすか」の判定は `node-drop` / `node-drag` に、
 * 「実測した親のずれからどの座標が書かれるか」は `reposition-target` にある。
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
    onReposition: (name: string, to: ChildPlacement) => void;
  }>,
): NodeDragControl {
  const [drag, dispatch] = useReducer(
    nodeDragReducer,
    undefined,
    NodeDrag.create,
  );

  const grabNode = (event: ReactPointerEvent<HTMLElement>): boolean => {
    const name = NodeDrag.grabbableName(
      params.document,
      namesToRoot(event.target),
    );
    if (!name.some) {
      return false;
    }
    dispatch({
      type: "grab",
      grab: {
        dragged: { kind: "existing", name: name.value },
        origin: CanvasPointer.offsetOf(event),
      },
    });
    return true;
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
      carrying: carryingAt({
        document: params.document,
        grab: grabbed.value,
        view: params.view,
        event,
      }),
    });
  };

  /** 届いた編集を、それぞれの受け口へ流す。 */
  const applyDrop = (edit: DropEdit) => {
    switch (edit.kind) {
      case "move":
        params.onMove(edit.name, edit.target.position);
        return;
      case "insert":
        params.onInsertAt(edit.template, edit.target.position);
        return;
      case "reposition":
        params.onReposition(edit.name, edit.target.to);
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
    grabNode,
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

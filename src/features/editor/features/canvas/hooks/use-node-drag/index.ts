import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useReducer,
} from "react";
import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Placement } from "@/domains/dcmp/placement";
import type { NodeRepositionEdit } from "@/domains/dcmp/reposition-edit";
import type {
  SiblingPlacement,
  SiblingPlacements,
} from "@/domains/dcmp/sibling-placements";
import { DocumentSelection } from "@/domains/session/document-selection";
import type { NodeTemplate } from "@/domains/session/node-template";
import type { UnderPointer } from "@/domains/session/under-pointer";
import type { Angle } from "@/domains/unit/angle";
import { Offset } from "@/domains/unit/offset";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import type { DistanceTargets } from "@/features/editor/features/canvas/domains/distance-targets";
import {
  Carrying,
  DropEdit,
  type Grab,
  NodeDrag,
} from "@/features/editor/features/canvas/domains/node-drag";
import {
  DropParent,
  DropZone,
  InsertionParent,
  type TreeDraggedNode,
} from "@/features/editor/features/canvas/domains/node-drop";
import { RepositionLines } from "@/features/editor/features/canvas/domains/reposition-lines";
import {
  type DropParentCoordinates,
  SiblingsRepositionTarget,
} from "@/features/editor/features/canvas/domains/reposition-target";
import { RotatedBounds } from "@/features/editor/features/canvas/domains/rotated-bounds";
import { SideSnap } from "@/features/editor/features/canvas/domains/side-snap";
import { CanvasPointer } from "@/features/editor/features/canvas/utils/CanvasPointer";
import { DrawnBounds } from "@/features/editor/features/canvas/utils/DrawnBounds";
import { CanvasDom } from "@/libs/canvas-dom";
import { AltKey, CommandKey } from "@/libs/dom-event";
import type { NonEmptyArray } from "@/types/NonEmptyArray";
import { ArrayEx } from "@/utils/ArrayEx";
import { ElementEx } from "@/utils/ElementEx";
import { Interop } from "@/utils/Interop";
import { Option } from "@/utils/Option";

/**
 * 絶対配置のノード（まとめて運ぶなら全員）を離したときに、置き直しを確定する手続き。
 *
 * @param edits 置き直すノードの名前と、書き込む親・座標と、向きを書き換えるならその向き。
 *   まとめて運んだなら全員ぶんをツリー順に並べて 1 回で渡す
 */
export type RepositionNodes = (
  edits: NonEmptyArray<NodeRepositionEdit>,
) => void;

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
 * 名前を持つ直下の要素。
 * コンパイル結果は子ノードを直下の `div` として並び順のまま出すので、DOM の順序が
 * そのままドキュメント上の順序になる。
 *
 * @param element 子を集める親の要素
 * @returns 名前を持つ直下の要素の並び（DOM の順）
 */
function namedChildrenOf(element: Element): readonly Element[] {
  return Array.from(element.children).filter((child) =>
    child.hasAttribute(ElementNameAttribute),
  );
}

/**
 * 親と、その直下に並ぶ子の矩形を実測する。
 *
 * @param parent 実測する落とし先の親
 * @returns 親と子の矩形を持つ落とし先の帯。親の要素が画面に無ければ `none`
 */
function measureZone(parent: InsertionParent): Option<DropZone> {
  return Option.map(CanvasDom.elementOf(parent.name), (element) =>
    DropZone.create(
      parent,
      CanvasDom.boundsOf(element),
      namedChildrenOf(element).map(CanvasDom.boundsOf),
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
 * 吸い付く先。それぞれの意味は `SideSnap` の同名のフィールド。`stationary` には落とし先の
 * 親の枠、`siblings` にはその親の直下にある運んでいるもの以外の子を入れる。
 */
type SnapTargets = Readonly<{
  stationary: readonly CanvasBounds[];
  siblings: readonly CanvasBounds[];
}>;

/** 吸い付かない回の揃え先。 */
const NoSnapTargets: SnapTargets = { stationary: [], siblings: [] };

/** まとめて運ぶ一員の、掴んだ時点の座標と自分の向き（今の親の向きを基準にした角度）。 */
type OrientedMember = SiblingPlacement & Readonly<{ ownRotation: Angle }>;

/**
 * 座標で運んでいる兄弟（1 つだけ運ぶなら一員が 1 つ）に、それを測っている今の親の向きと
 * 一員ごとの自分の向きを添えたもの。
 *
 * 向きは `repositionCarrying` が 1 回だけ引き、ずらし量と実測の両方へ同じ値を配る。
 */
type OrientedSiblings = Readonly<{
  parentName: string;
  parentRotation: Angle;
  /** 一員それぞれの座標と自分の向き。ツリー順。 */
  placed: NonEmptyArray<OrientedMember>;
}>;

/**
 * 座標の置き直しに要る実測。
 *
 * 単位が 1 つだけ違う: `origin` / `dragged` / `parentBounds` / `siblings` は実測したままの**画面上の px**、
 * `dropParent.shift` だけは書かれる座標へ足す量なので**ドキュメント上の px**（倍率で割り戻し済み）。
 */
type RepositionMeasure = Readonly<{
  dropParent: DropParentCoordinates;
  /**
   * 今の親の回って描かれている矩形。掴んだ時点の座標はこの親の座標（`RotatedBounds.placedAt`）
   * で測っているので、行き先の組み立てに使う。
   */
  origin: RotatedBounds;
  /**
   * 運んでいるノード（まとめて運ぶなら全員。ツリー順）の、掴んだ時点の座標と自分の向き、
   * 回る前の大きさと向き（`bounds`。位置は使わない）。
   */
  dragged: NonEmptyArray<OrientedMember & Readonly<{ bounds: RotatedBounds }>>;
  /** 落とし先の親の外接矩形 */
  parentBounds: CanvasBounds;
  /** その親の直下の、運んでいるもの（まとめて運ぶなら全員）以外の子 */
  siblings: readonly CanvasBounds[];
}>;

/**
 * 座標の置き直しに要るものを、落とし先の親を 1 回だけ実測して揃える。
 *
 * 親の矩形はレイアウトを通すまで決まらない（`hug` / `fill`）ので実測し、倍率は割り戻す
 * （落とし先が今の親と同じでも分岐しない）。落とし先の親は、揃え先としても距離の相手として
 * も、回っていても外接矩形で見る（docs/06-ui.md の辺のスナップ）。
 *
 * @param context 運んでいるノードと落とし先の親の向きの引き先のドキュメントと、倍率を持つ
 *   今の掴み。倍率は実測の割り戻しと、回ったもののレイアウトの大きさを画面上の大きさへ直す
 *   のに使う
 * @param grabbed 運んでいる兄弟と今の親、掴んだ時点の座標と今の親の向き・一員ごとの自分の向き
 * @param dropped 落とし先の親
 * @returns 置き直しに要る実測。今の親・落とし先・運んでいるノード（まとめて運ぶなら一員の
 *   どれか 1 つでも）が画面に無い・運んでいるノードか落とし先の親の向きが引けない・回って
 *   いるのにレイアウトの大きさを測れないときは `none`（測れないまま座標を書かない）
 */
function measureReposition(
  context: DropContext,
  grabbed: OrientedSiblings,
  dropped: DropParent,
): Option<RepositionMeasure> {
  const measureByName = (name: string): Option<RotatedBounds> =>
    Option.flatMap(
      DesignDocument.totalRotationOf(context.document, name),
      (rotation) => DrawnBounds.measureRotated(name, rotation, context.view),
    );
  const currentBounds = DrawnBounds.measureRotated(
    grabbed.parentName,
    grabbed.parentRotation,
    context.view,
  );
  const droppedRotated = measureByName(dropped.name);
  // 落とし先は `DrawnBounds` だけに寄せない。直下の子の矩形を集めるのに要素が要る
  const droppedElement = CanvasDom.elementOf(dropped.name);
  const dragged = Interop.toOption(
    ArrayEx.mapNonEmptyUntilErr(grabbed.placed, (member) =>
      Interop.toResult(
        Option.map(measureByName(member.name), (bounds) => ({
          ...member,
          bounds,
        })),
        member.name,
      ),
    ),
  );
  // 座標を書くにも揃え先を出すにもすべて要るので、1 つでも欠けたら測れなかったとみなす
  const measurable =
    Option.isSome(currentBounds) &&
    Option.isSome(droppedRotated) &&
    Option.isSome(droppedElement) &&
    Option.isSome(dragged);
  if (!measurable) {
    return Option.none;
  }
  const droppedBounds = CanvasDom.boundsOf(droppedElement.value);
  const isCarried = (child: Element) =>
    grabbed.placed.some(
      (member) => child.getAttribute(ElementNameAttribute) === member.name,
    );
  const siblings = namedChildrenOf(droppedElement.value)
    .filter((child) => !isCarried(child))
    .map(CanvasDom.boundsOf);
  return Option.some({
    dropParent: {
      name: dropped.name,
      shift: CanvasView.toDocumentOffset(
        context.view,
        RotatedBounds.originShift(currentBounds.value, droppedRotated.value),
      ),
      rotation: droppedRotated.value.rotation,
    },
    origin: currentBounds.value,
    dragged: dragged.value,
    parentBounds: droppedBounds,
    siblings,
  });
}

/**
 * 寄せる前の、運んでいるもの（まとめて運ぶなら全員を囲む矩形）の行き先の矩形。
 *
 * 一員ごとに回る前の矩形を掴んだ時点の位置へ置いて、それを回した軸に平行な外接矩形を取り、
 * その和を画面上で運んだ量だけずらして運んでいるものの矩形にする（docs/06-ui.md の辺の
 * スナップ）。運んだ量を親の向きへ戻さずに画面のまま足すのは、判定も寄せ量も画面の向きで
 * 行うため。
 *
 * 置く位置まで実測から採れないのは、運んでいる間は `translate` でずらして見せており
 * （`repositionPreviewDeclarations`）**前回の移動分が既に乗っている**ため。
 *
 * @param measured 落とし先の実測（寄せの原点と、一員ごとの掴んだ時点の座標と回る前の大きさ
 *   と向き）
 * @param carry 掴んだ時点の座標を画面上の px へ直す倍率（`view`）と、画面上で運んだ量
 *   （`screenDelta`。画面上の px）
 * @returns 運んでいるものの外接矩形（画面上の px）
 */
function destinationBounds(
  measured: RepositionMeasure,
  carry: Readonly<{ view: CanvasView; screenDelta: Offset }>,
): CanvasBounds {
  const enclosingEach = ArrayEx.mapNonEmpty(measured.dragged, (member) =>
    RotatedBounds.toEnclosing(
      RotatedBounds.placedAt(
        member.bounds,
        measured.origin,
        CanvasView.toScreenOffset(
          carry.view,
          Placement.offset(member.placement),
        ),
      ),
    ),
  );
  return CanvasBounds.movedBy(
    CanvasBounds.enclosingAll(enclosingEach),
    carry.screenDelta,
  );
}

/**
 * まとめて運ぶ一員それぞれの、自分の向き。
 *
 * @param document 向きの引き先になるドキュメント
 * @param siblings 運んでいる兄弟
 * @returns 一員ごとの掴んだ時点の座標と自分の向き。1 つでも向きが引けなければ `none`
 */
function orientedMembersOf(
  document: DesignDocument,
  siblings: SiblingPlacements,
): Option<NonEmptyArray<OrientedMember>> {
  return Interop.toOption(
    ArrayEx.mapNonEmptyUntilErr(siblings.placed, (member) =>
      Interop.toResult(
        Option.map(
          DesignDocument.rotationOf(document, member.name),
          (ownRotation): OrientedMember => ({ ...member, ownRotation }),
        ),
        member.name,
      ),
    ),
  );
}

/**
 * 掴んでいる絶対配置のノード（まとめて運ぶなら全員）を、今のポインタまで運んだときの運び方。
 *
 * 運んだ量は画面上の移動量を倍率で割り戻したもので（倍率を変えても掴んだ点に追従する）、
 * そこから今の親の向きへ戻して書かれる座標と向き・見た目のずらし量を決めるのは
 * `SiblingsRepositionTarget`。まとめて運ぶときも、寄せ・ガイド線・隙間・Alt / Option の距離は
 * 全員を囲む矩形を 1 つ運んでいるものとして見る（docs/06-ui.md「キャンバス直接操作」）。
 *
 * ⌘ / Ctrl を押しながら動かしている間は吸い付かない（docs/06-ui.md の辺のスナップ）。
 * Alt / Option を押している間は上下左右の距離も測る（docs/06-ui.md）。
 *
 * **落とせる親がポインタの下に無くても、見た目は追従させる**（ずらし量は落とし先の親の
 * 座標への直しを含まないので親が決まらなくても決まる）。追従を止めると、キャンバスの余白へ
 * 一瞬寄っただけで元の位置へ戻り、運べているのか分からなくなる。
 *
 * @param context 今の掴みと、倍率・ポインタ
 * @param siblings 運んでいる兄弟（1 つだけ運ぶなら一員が 1 つ）と、掴んだ時点の座標
 * @returns 座標を置き直す運び方。親が無い / 親の矩形と運んでいるノードのどれかを
 *   実測できないときは見た目だけの運び方。今の親の向きか一員の自分の向きが引けないときは
 *   何も起きない運び方
 */
function repositionCarrying(
  context: DropContext,
  siblings: SiblingPlacements,
): Carrying {
  const parentRotation = DesignDocument.totalRotationOf(
    context.document,
    siblings.parentName,
  );
  const members = orientedMembersOf(context.document, siblings);
  const isOrientationKnown =
    Option.isSome(parentRotation) && Option.isSome(members);
  /*
   * 子の配置を引けた親は向きも引け、座標を引けたノードはプリミティブなので自分の向きも
   * 引けるので、ここへは来ない。0 度とみなして見た目だけ追従させると、回った親の中では
   * 運んだ向きと違う向きへずれて見えるので何もしない。
   */
  if (!isOrientationKnown) {
    return Carrying.nothing();
  }
  const grabbed: OrientedSiblings = {
    parentName: siblings.parentName,
    parentRotation: parentRotation.value,
    placed: members.value,
  };
  const screenDelta = Offset.delta(
    context.grab.origin,
    CanvasPointer.offsetOf(context.event),
  );
  const parent = DropParent.innermost(
    context.document,
    context.grab.dragged,
    namesToRoot(context.event.target),
  );
  const measured = Option.flatMap(parent, (dropped) =>
    measureReposition(context, grabbed, dropped),
  );
  if (!Option.isSome(measured)) {
    return Carrying.preview(
      SiblingsRepositionTarget.carriedPreview(
        grabbed,
        CanvasView.toDocumentOffset(context.view, screenDelta),
      ),
    );
  }
  /*
   * 吸い付かない回は揃え先を空にして同じ判定へ通す。寄せ無しの答えを別に組むと、揃え先が
   * 無いときの答え（寄せ量 0・線無し）が 2 か所に書かれる。
   */
  const targets = CommandKey.isHeld(context.event)
    ? NoSnapTargets
    : {
        stationary: [measured.value.parentBounds],
        siblings: measured.value.siblings,
      };
  const destination = destinationBounds(measured.value, {
    view: context.view,
    screenDelta,
  });
  const distanceTargets: Option<DistanceTargets> = AltKey.isHeld(context.event)
    ? Option.some({
        kind: "within-parent",
        parentBounds: measured.value.parentBounds,
        siblings: measured.value.siblings,
      })
    : Option.none;
  const snap = RepositionLines.toSnapped(
    SideSnap.withSiblings(
      SideSnap.create(destination, targets.stationary),
      targets.siblings,
    ),
    distanceTargets,
  );
  // 寄せ量を運んだ量へ畳んでから渡すので、書かれる座標と見た目のずらし量が同じ材料から出る
  const snapped = Offset.add(screenDelta, snap.offset);
  return Carrying.droppable(
    DropEdit.reposition(
      SiblingsRepositionTarget.create(
        {
          parentName: grabbed.parentName,
          parentRotation: grabbed.parentRotation,
          placed: ArrayEx.mapNonEmpty(measured.value.dragged, (member) => ({
            name: member.name,
            placement: member.placement,
            ownRotation: member.ownRotation,
            centerFromTopLeft: CanvasView.toDocumentOffset(
              context.view,
              RotatedBounds.centerFromTopLeft(member.bounds),
            ),
          })),
        },
        CanvasView.toDocumentOffset(context.view, snapped),
        measured.value.dropParent,
      ),
      snap.lines,
    ),
  );
}

/**
 * 掴んでいるものを、今のポインタでツリーへ落とすときの運び方。
 * 実体は動かさず、落ちる先はドロップ線で見せる。
 *
 * @param context 今の掴みと、落とし先を決めるための材料
 * @param dragged 運んでいるもの（既存ノード 1 つか雛形）
 * @returns ツリーへ落とす運び方。親が無い / 帯を実測できないなら何も起きない運び方
 */
function intoTreeCarrying(
  context: DropContext,
  dragged: TreeDraggedNode,
): Carrying {
  const parent = InsertionParent.innermost(
    context.document,
    dragged,
    namesToRoot(context.event.target),
  );
  const target = Option.flatMap(parent, (accepted) =>
    Option.map(measureZone(accepted), (zone) =>
      DropZone.targetAt(zone, CanvasPointer.offsetOf(context.event)),
    ),
  );
  return Option.isSome(target)
    ? Carrying.droppable(DropEdit.intoTree(dragged, target.value))
    : Carrying.nothing();
}

/**
 * 今の運び方。絶対配置のノードを運んでいる（まとめて運ぶ兄弟を含む）なら座標の置き直し、
 * そうでなければツリーへの移動・挿入。
 *
 * 運び方を先に決めてから、その経路が要る親だけを解決する。既存ノード 1 つを運んでいるとき
 * は、座標で動かせる（`findSiblingPlacements` が答える）ことが「座標の置き直しになる」と
 * 同じ意味になる（フローのノードは座標を持たない）。
 *
 * **その運び方は実測の成否では変わらない。** 置き直しに決まったあとで実測に失敗したら、
 * ツリーの移動へ落とさずそのまま「落とせない」にする（落とすと、座標を動かすつもりのド
 * ラッグが黙って木の並びを書き換える別の編集になる）。
 *
 * @param context 今の掴みと、落とし先を決めるための材料
 * @returns 今の運び方
 */
function carryingAt(context: DropContext): Carrying {
  const dragged = context.grab.dragged;
  switch (dragged.kind) {
    case "new":
      return intoTreeCarrying(context, dragged);
    case "existing": {
      const placed = DesignDocument.findSiblingPlacements(context.document, [
        dragged.name,
      ]);
      return Option.isSome(placed)
        ? repositionCarrying(context, placed.value)
        : intoTreeCarrying(context, dragged);
    }
    case "selected-siblings":
      return repositionCarrying(context, dragged.siblings);
  }
}

/** 運んでいる間のポインタと、離した直後の `click` を受ける側（3 ペインの器）へ渡す props。 */
export type NodeDragHandlers = Readonly<{
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  /** 運んだ直後の `click` を飲み込む（選択に使わせない / `NodeDrag` の `dropped`）。 */
  onClickCapture: (event: ReactMouseEvent<HTMLElement>) => void;
}>;

/** ドラッグ中の状態と、画面の要素へ渡すハンドラ。 */
export type NodeDragControl = Readonly<{
  drag: NodeDrag;
  /**
   * 今パレットから運んでいる雛形。掴んだ行の強調とキャンバスのツールバーの点灯がこれで決
   * まり、運んでいない / 既存ノードを運んでいるなら `none`。
   *
   * **届く先の配線を外してもテストは 1 件も落ちない** — 戻り値はこのフックの単体テストが
   * 見ているが、届く先はどちらも class の差し替えだけ（`asset-row` の強調 /
   * `canvas-toolbar` の `◆` の背景）で、happy-dom では見えない。気づく手段は Storybook の
   * 視覚差分だけ。
   */
  carriedTemplate: Option<NodeTemplate>;
  /**
   * 押された位置にある既存ノードのうち、同じ押し方のクリックが選ぶものを掴む
   * （`DocumentSelection.nodeNameAt`）。掴めたら、掴んだものを選ぶ（`onSelectGrabbed`）。
   * 掴んだものが選んでいる兄弟をまとめて運べる一員なら（`DocumentSelection.carriedSiblingsAt`）、
   * 選択を変えずに全員を掴む。
   * 編集中の入力欄を選び直す前のものへ確定させるには、呼ぶ前に呼び出し側がフォーカスを移し
   * ておく（`ArtboardFrame` の `onPointerDown`）。
   *
   * **artboard の背景を押したときに `false` を返すことに、キャンバスの掴み分けが載ってい
   * る**（`ArtboardFrame` の `onPointerDown`）。掴めるようにすると、背景から範囲選択を
   * 始められなくなる。
   *
   * @param event artboard の枠で受けた `pointerdown`
   * @param underPointer 押された位置（どの深さで読むかを含む）。クリックが選ぶときと同じ
   *   集め方・読み替えで受け取る
   * @returns 掴んだ（＝この先の判定へ渡さない）なら `true`。押された位置から根までに
   *   選べるノードが 1 つも無ければ `false`（artboard の背景か、ロック中のノードの上を押し
   *   たとき / docs/03「ロック」）
   */
  grabNode: (
    event: ReactPointerEvent<HTMLElement>,
    underPointer: UnderPointer,
  ) => boolean;
  dragHandlers: NodeDragHandlers;
  /** パレットの行から掴む。掴めるものは行が知っているので指定を受け取る。 */
  grabTemplate: (
    template: NodeTemplate,
    event: ReactPointerEvent<HTMLElement>,
  ) => void;
}>;

/**
 * 掴んでキャンバスへ落とす操作を、ツリー上の位置への移動・挿入か、絶対配置のノードの座標
 * の置き直し（親をまたげば付け替え）として解釈する（docs/06-ui.md「キャンバス直接操作」/
 * docs/02-data-model.md「基本原則」）。
 *
 * このフックが持つのは DOM の実測・イベントの仲介と、修飾キーの解釈（⌘ / Ctrl なら揃え先を
 * 渡さない、Alt / Option なら距離を測る）だけで、落ちる先・書く座標・寄せ量と線は
 * `node-drop` / `node-drag` / `reposition-target` / `reposition-lines` が決める。
 *
 * @param params 掴むものと落とし先を決める `selection` / `view` と、既存ノードを掴んだ時点で
 *   そのノードを選ぶ `onSelectGrabbed`（まとめて運ぶときは呼ばない）、確定したときに呼ぶ
 *   `onMove` / `onInsertAt` / `onReposition`
 * @returns 今のドラッグの状態と、画面の要素へ渡すハンドラ
 */
export function useNodeDrag(
  params: Readonly<{
    selection: DocumentSelection;
    view: CanvasView;
    onMove: (name: string, to: ChildPosition) => void;
    onInsertAt: (template: NodeTemplate, at: ChildPosition) => void;
    onReposition: RepositionNodes;
    onSelectGrabbed: (name: string) => void;
  }>,
): NodeDragControl {
  const [drag, dispatch] = useReducer(
    nodeDragReducer,
    undefined,
    NodeDrag.create,
  );

  const grabNode = (
    event: ReactPointerEvent<HTMLElement>,
    underPointer: UnderPointer,
  ): boolean => {
    const origin = CanvasPointer.offsetOf(event);
    const carried = DocumentSelection.carriedSiblingsAt(
      params.selection,
      underPointer,
    );
    if (Option.isSome(carried)) {
      dispatch({
        type: "grab",
        grab: {
          dragged: { kind: "selected-siblings", siblings: carried.value },
          origin,
        },
      });
      return true;
    }
    const name = DocumentSelection.nodeNameAt(params.selection, underPointer);
    if (!Option.isSome(name)) {
      return false;
    }
    params.onSelectGrabbed(name.value);
    dispatch({
      type: "grab",
      grab: {
        dragged: { kind: "existing", name: name.value },
        origin,
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
    if (!Option.isSome(grabbed)) {
      return;
    }
    dispatch({
      type: "move",
      pointer: CanvasPointer.offsetOf(event),
      carrying: carryingAt({
        document: params.selection.document,
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
        params.onReposition(SiblingsRepositionTarget.toEdits(edit.target));
        return;
    }
  };

  /**
   * 離した時点で提示していた落とし方で落とす（最後に届いた移動が決めた編集）。
   * 誰をどう動かすかは `DropEdit` が持っているので、ここでは運んでいたものを見ない。
   */
  const release = () => {
    const drop = NodeDrag.drop(drag);
    if (Option.isSome(drop)) {
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
      /*
       * 離した直後の `click` は、押した場所と離した場所の最も近い共通の祖先に出る
       * （Chromium で実測）。離した場所によって枠の中にもキャンバスの土台にもなり、左ペイン
       * まで運べばこの器そのものになるので、いちばん外側のここで受ける。枠で受けると、枠の
       * 外で離した回は飲み込めないまま状態が次の `click` まで残る。
       *
       * capture で取るのは、bubble では先に枠の `onClick` が選択に使ってしまうため。
       */
      onClickCapture: (event) => {
        if (!NodeDrag.consumesClick(drag)) {
          return;
        }
        event.stopPropagation();
        dispatch({ type: "consume_click" });
      },
    },
  };
}

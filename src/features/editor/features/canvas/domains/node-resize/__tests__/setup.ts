import { AxisLength } from "@/domains/dcmp/axis-length";
import type { ResizeEdit } from "@/domains/dcmp/resize-edit";
import type { DocumentSelection } from "@/domains/session/document-selection";
import { Offset } from "@/domains/unit/offset";
import { resizeAnchorAt } from "@/features/editor/features/canvas/__tests__/canvas-resize";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import type { RotatedBounds } from "@/features/editor/features/canvas/domains/rotated-bounds";
import { Option } from "@/utils/Option";
import {
  NodeResize,
  type ResizableSelection,
  type ResizeGrip,
  type ResizeHandleAnchor,
  type ResizeHold,
  type ResizeTargetNames,
} from "../index";

/** 画面の (100, 50) から 200x100 の大きさで描かれている要素。 */
export function setupBounds(): CanvasBounds {
  return { left: 100, top: 50, width: 200, height: 100 };
}

/** `setupBounds` に回らずに描かれている要素。 */
export function setupRotatedBounds(): RotatedBounds {
  return { unrotated: setupBounds(), rotation: 0 };
}

/** 2 軸とも掴めて、(30, 70) に置かれている要素（左辺・上辺も掴める）。 */
export function setupResizable(): ResizableSelection {
  return {
    lengths: [
      AxisLength.create("width", 200),
      AxisLength.create("height", 100),
    ],
    origin: Option.some({ x: 30, y: 70 }),
    targets: { kind: "none" },
    rotation: { own: 0, total: 0 },
  };
}

/** 2 軸とも掴めるが位置を持たない要素（フロー配置のノード）。 */
export function setupFlowResizable(): ResizableSelection {
  return { ...setupResizable(), origin: Option.none };
}

/** 幅だけが固定で、(30, 70) に置かれている要素（高さは掴めない）。 */
export function setupWidthOnlyResizable(): ResizableSelection {
  return { ...setupResizable(), lengths: [AxisLength.create("width", 200)] };
}

/** 高さだけが固定で、(30, 70) に置かれている要素（幅は掴めない）。 */
export function setupHeightOnlyResizable(): ResizableSelection {
  return { ...setupResizable(), lengths: [AxisLength.create("height", 100)] };
}

/** 等倍で見ているキャンバス。 */
export function setupView(): CanvasView {
  return CanvasView.create();
}

/** 幅 200 を右辺（終点側）で掴んだもの。掴める軸を持たない選択にもそのまま渡せる。 */
export const RightEdgeGrip: ResizeGrip = {
  kind: "width",
  width: { length: AxisLength.create("width", 200), end: "end" },
};

/**
 * その箇所で掴めるもの。
 *
 * @param resizable 掴む対象
 * @param anchor 押した箇所
 * @returns その箇所で掴めるもの（掴めなければテストを落とす）
 */
export function gripAt(
  resizable: ResizableSelection,
  anchor: ResizeHandleAnchor,
): ResizeGrip {
  return Option.unwrap(
    NodeResize.gripFor(resizable, Option.unwrap(resizeAnchorAt(anchor))),
  );
}

/**
 * その掴み方で掴んだときの揃え先と距離の相手の名前。
 *
 * @param resizable 掴む対象
 * @param grip 掴んだもの
 * @returns `NodeResize.hold` が絞った揃え先と距離の相手の名前
 */
export function heldTargetNames(
  resizable: ResizableSelection,
  grip: ResizeGrip,
): Option<ResizeTargetNames> {
  return NodeResize.hold(resizable, grip, Offset.Origin).targetNames;
}

/**
 * 選んだものをその箇所で掴んだときの揃え先と距離の相手の名前。
 *
 * @param selection ドキュメントと選択の対
 * @param anchor 押した箇所
 * @returns `NodeResize.hold` が絞った揃え先と距離の相手の名前（掴めなければテストを落とす）
 */
export function targetNamesAt(
  selection: DocumentSelection,
  anchor: ResizeHandleAnchor,
): Option<ResizeTargetNames> {
  const resizable = NodeResize.resizable(selection);
  return heldTargetNames(resizable, gripAt(resizable, anchor));
}

/**
 * その箇所を押して掴んだもの。
 *
 * @param resizable 掴む対象
 * @param anchor 押した箇所
 * @param pointerOrigin 押した位置
 * @returns 掴んだもの（掴んだ時点の実測は載っていない）
 */
export function heldAt(
  resizable: ResizableSelection,
  anchor: ResizeHandleAnchor,
  pointerOrigin: Offset,
): ResizeHold {
  return NodeResize.hold(resizable, gripAt(resizable, anchor), pointerOrigin);
}

/**
 * その箇所を押して掴んだ状態。
 *
 * @param resizable 掴む対象
 * @param anchor 押した箇所
 * @param pointerOrigin 押した位置
 * @returns 掴んだ状態
 */
export function grabbedAt(
  resizable: ResizableSelection,
  anchor: ResizeHandleAnchor,
  pointerOrigin: Offset,
): NodeResize {
  return NodeResize.grab(heldAt(resizable, anchor, pointerOrigin));
}

/**
 * `setupResizable` をその箇所で押して掴み、揃え先と距離の相手の名前を差し替えたうえで、
 * 掴んだ時点の矩形（`setupBounds`）と名前ごとの矩形から実測を載せた状態。
 *
 * @param anchor 押した箇所
 * @param pointerOrigin 押した位置
 * @param drawn 揃え先と距離の相手の名前と、名前ごとに描かれている矩形（無い名前は引けない）
 * @returns 掴んだ状態
 */
export function grabbedWithTargets(
  anchor: ResizeHandleAnchor,
  pointerOrigin: Offset,
  drawn: Readonly<{
    names: ResizeTargetNames;
    boundsByName: Readonly<Record<string, CanvasBounds>>;
  }>,
): NodeResize {
  const held: ResizeHold = {
    ...heldAt(setupResizable(), anchor, pointerOrigin),
    targetNames: Option.some(drawn.names),
  };
  return grabbedWithMeasured(held, drawn.boundsByName);
}

/**
 * 掴んだものに、掴んだ時点の矩形（`setupBounds`）と名前ごとの矩形から実測を載せて掴んだ状態。
 *
 * @param held 掴んだもの。揃え先と距離の相手の名前（`targetNames`）を持つ
 * @param boundsByName 名前ごとに描かれている矩形（無い名前は引けない）
 * @returns 掴んだ状態
 */
export function grabbedWithMeasured(
  held: ResizeHold,
  boundsByName: Readonly<Record<string, CanvasBounds>>,
): NodeResize {
  return NodeResize.grab(
    NodeResize.withMeasured(held, {
      grabbed: setupBounds(),
      measure: (name) => Option.fromNullable(boundsByName[name]),
    }),
  );
}

/**
 * その箇所を押して掴み、掴んだ時点の矩形（`setupBounds`）と揃え先で実測を載せた状態。
 *
 * @param anchor 押した箇所
 * @param pointerOrigin 押した位置
 * @param stationary 揃え先の矩形の並び
 * @returns 掴んだ状態
 */
export function grabbedWithSnap(
  anchor: ResizeHandleAnchor,
  pointerOrigin: Offset,
  stationary: readonly CanvasBounds[],
): NodeResize {
  const otherNames = stationary.map((_, index) => `stationary-${index}`);
  return grabbedWithTargets(anchor, pointerOrigin, {
    names: { kind: "among-artboards", otherNames },
    boundsByName: Object.fromEntries(
      stationary.map((bounds, index) => [otherNames[index], bounds]),
    ),
  });
}

/**
 * 今のポインタ位置で書き込む編集だけ（揃った線を見ないテストが、線を巻き込まないため）。
 *
 * @param resize 今のリサイズの状態
 * @param pointer 今のポインタの位置
 * @param view 画面上の量をドキュメント上の量へ直す倍率
 * @returns 書き込む編集。掴んでいなければ `none`
 */
export function resizeEditAt(
  resize: NodeResize,
  pointer: Offset,
  view: CanvasView,
): Option<ResizeEdit> {
  return Option.map(
    NodeResize.trackedAt(resize, pointer, view),
    (tracked) => tracked.edit,
  );
}

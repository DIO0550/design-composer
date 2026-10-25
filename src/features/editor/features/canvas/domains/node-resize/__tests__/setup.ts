import { AxisLength } from "@/domains/dcmp/axis-length";
import type { ResizeEdit } from "@/domains/dcmp/resize-edit";
import type { DocumentSelection } from "@/domains/session/document-selection";
import { Offset } from "@/domains/unit/offset";
import { resizeAnchorAt } from "@/features/editor/features/canvas/__tests__/canvas-resize";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import type { RotatedBounds } from "@/features/editor/features/canvas/domains/rotated-bounds";
import { SideSnap } from "@/features/editor/features/canvas/domains/side-snap";
import { Option } from "@/utils/Option";
import {
  NodeResize,
  type ResizableSelection,
  type ResizeGrip,
  type ResizeHandleAnchor,
  type ResizeHold,
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
    snapTargets: { kind: "none" },
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
 * その掴み方で掴んだときの揃え先の名前。
 *
 * @param resizable 掴む対象
 * @param grip 掴んだもの
 * @returns `NodeResize.hold` が絞った揃え先の名前
 */
export function heldSnapTargetNames(
  resizable: ResizableSelection,
  grip: ResizeGrip,
): readonly string[] {
  return NodeResize.hold(resizable, grip, Offset.Origin).snapTargetNames;
}

/**
 * 選んだものをその箇所で掴んだときの揃え先の名前。
 *
 * @param selection ドキュメントと選択の対
 * @param anchor 押した箇所
 * @returns `NodeResize.hold` が絞った揃え先の名前（掴めなければテストを落とす）
 */
export function snapTargetNamesAt(
  selection: DocumentSelection,
  anchor: ResizeHandleAnchor,
): readonly string[] {
  const resizable = NodeResize.resizable(selection);
  return heldSnapTargetNames(resizable, gripAt(resizable, anchor));
}

/**
 * その箇所を押して掴んだもの。
 *
 * @param resizable 掴む対象
 * @param anchor 押した箇所
 * @param pointerOrigin 押した位置
 * @returns 掴んだもの（辺のスナップの組は載っていない）
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
 * その箇所を押して掴み、掴んだ時点の矩形（`setupBounds`）とその揃え先で辺のスナップの組を
 * 載せた状態。
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
  return NodeResize.grab(
    NodeResize.withSideSnap(
      heldAt(setupResizable(), anchor, pointerOrigin),
      SideSnap.create(setupBounds(), stationary),
    ),
  );
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

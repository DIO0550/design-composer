import { AxisLength } from "@/domains/dcmp/axis-length";
import type { Offset } from "@/domains/unit/offset";
import { resizeAnchorAt } from "@/features/editor/features/canvas/__tests__/canvas-resize";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";
import {
  NodeResize,
  type ResizableSelection,
  type ResizeHandleAnchor,
  type ResizeHold,
} from "../index";

/** 画面の (100, 50) から 200x100 の大きさで描かれている要素。 */
export function setupBounds(): CanvasBounds {
  return { left: 100, top: 50, width: 200, height: 100 };
}

/** 2 軸とも掴めて、(30, 70) に置かれている要素（左辺・上辺も掴める）。 */
export function setupResizable(): ResizableSelection {
  return {
    lengths: [
      AxisLength.create("width", 200),
      AxisLength.create("height", 100),
    ],
    origin: Option.some({ x: 30, y: 70 }),
    snapTargetNames: [],
  };
}

/** 2 軸とも掴めるが位置を持たない要素（フロー配置のノード）。 */
export function setupFlowResizable(): ResizableSelection {
  return { ...setupResizable(), origin: Option.none };
}

/** 等倍で見ているキャンバス。 */
export function setupView(): CanvasView {
  return CanvasView.create();
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
  return NodeResize.hold(
    resizable,
    Option.unwrap(
      NodeResize.gripFor(resizable, Option.unwrap(resizeAnchorAt(anchor))),
    ),
    pointerOrigin,
  );
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

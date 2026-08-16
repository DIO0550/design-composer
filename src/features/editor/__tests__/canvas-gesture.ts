import { fireEvent } from "@testing-library/react";
import type { CanvasOffset } from "@/features/editor/domains/canvas-view";

/**
 * キャンバスへのポインタ / ホイール操作。
 * キャンバス本体（components/artboard-canvas）とズーム / パンのフック
 * （hooks/use-canvas-view）の両方から使うため、feature 直下に置いて共有する。
 */

/** 1 本の指 / 1 つのマウスによる操作として扱う。 */
const PointerId = 1;

export function pressPointer(element: Element, at: CanvasOffset): void {
  fireEvent.pointerDown(element, {
    pointerId: PointerId,
    clientX: at.x,
    clientY: at.y,
  });
}

export function movePointer(element: Element, to: CanvasOffset): void {
  fireEvent.pointerMove(element, {
    pointerId: PointerId,
    clientX: to.x,
    clientY: to.y,
  });
}

export function releasePointer(element: Element, at: CanvasOffset): void {
  fireEvent.pointerUp(element, {
    pointerId: PointerId,
    clientX: at.x,
    clientY: at.y,
  });
}

/** 掴んで運んで離す、までを 1 つの操作として起こす。 */
export function drag(
  element: Element,
  movement: Readonly<{ from: CanvasOffset; to: CanvasOffset }>,
): void {
  pressPointer(element, movement.from);
  movePointer(element, movement.to);
  releasePointer(element, movement.to);
}

/** ホイールと一緒に押されている修飾キー。 */
export type WheelModifier = "none" | "ctrl" | "meta";

/**
 * ホイールを回す。
 * happy-dom の `WheelEvent` は `UIEvent` 派生で修飾キーを持たないため、
 * 修飾キーはイベントを組み立てたあとに与える。
 */
export function wheel(
  element: Element,
  delta: CanvasOffset,
  modifier: WheelModifier,
): void {
  const event = new WheelEvent("wheel", {
    deltaX: delta.x,
    deltaY: delta.y,
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, "ctrlKey", { value: modifier === "ctrl" });
  Object.defineProperty(event, "metaKey", { value: modifier === "meta" });
  fireEvent(element, event);
}

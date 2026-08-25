import { fireEvent } from "@testing-library/react";
import type { CanvasOffset } from "@/features/canvas/domains/canvas-view";

/**
 * キャンバスへのポインタ / ホイール操作。
 * キャンバス本体（`components/artboard-canvas`）とズーム / パンのフック
 * （`hooks/use-canvas-view`）、および編集画面の通し（`features/editor` の
 * `opened-document-editor`）から使うため、feature 直下に置いて共有する。
 * 外の feature へはテスト用の公開口（`__tests__/index.ts`）から出す
 * （分けている理由はその `__tests__/index.ts` の doc）。
 *
 * ポインタそのものの操作は左ペインの並べ替えでも同じものが要るので、横断層
 * （`components/__tests__/pointer-gesture`）へ置いて委譲する。ここに残すのは
 * ホイール（キャンバス固有）と、`CanvasOffset` で受ける入口だけ。
 */

import {
  movePointer as movePointerAt,
  pressPointer as pressPointerAt,
  releasePointer as releasePointerAt,
} from "@/components/__tests__/pointer-gesture";

export function pressPointer(element: Element, at: CanvasOffset): void {
  pressPointerAt(element, at);
}

export function movePointer(element: Element, to: CanvasOffset): void {
  movePointerAt(element, to);
}

export function releasePointer(element: Element, at: CanvasOffset): void {
  releasePointerAt(element, at);
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

import { fireEvent } from "@testing-library/react";
import type { Offset } from "@/domains/unit/offset";

/**
 * キャンバスへのポインタ / ホイール操作。キャンバス本体・ズーム / パンのフック・編集画面の
 * 通しから使うため、feature 直下に置いて共有する（外の feature へはテスト用の公開口から出
 * す）。
 *
 * ポインタそのものの操作は左ペインの並べ替えでも同じものが要るので、横断層
 * （`components/__tests__/pointer-gesture`）へ移して**そのまま再輸出**する。ここが自前で持
 * つのはキャンバス固有のホイールと、space（パン）・Alt / Option（距離）のキーだけ。
 */

import {
  modifierKeysOf,
  type PressedModifier,
} from "@/components/__tests__/pointer-gesture";

export {
  drag,
  enterPointer,
  leavePointer,
  leavePointerInto,
  movePointer,
  PointerId,
  type PressedModifier,
  pressPointer,
  pressPointerHolding,
  releasePointer,
} from "@/components/__tests__/pointer-gesture";

/**
 * パンの修飾キーを押す / 離す。
 *
 * `code` で撃つのは、フックが打たれた文字ではなく物理キーで見ているのに合わせる。
 */
export function holdSpace(): void {
  fireEvent.keyDown(globalThis.document, { code: "Space", key: " " });
}

export function releaseSpace(): void {
  fireEvent.keyUp(globalThis.document, { code: "Space", key: " " });
}

/**
 * Alt / Option を押す / 離す（選択しているだけのときの距離の修飾キー）。
 *
 * `code` で撃つのは、フックが打たれた文字ではなく物理キーで見ているのに合わせる。
 *
 * @param target キーを受け取る要素（フォーカスのある要素）。既定は文書全体
 */
export function holdAlt(
  target: Element | Document = globalThis.document,
): void {
  fireEvent.keyDown(target, { code: "AltLeft", key: "Alt", altKey: true });
}

export function releaseAlt(): void {
  fireEvent.keyUp(globalThis.document, {
    code: "AltLeft",
    key: "Alt",
    altKey: false,
  });
}

/**
 * ホイールを回す。
 * happy-dom の `WheelEvent` は `UIEvent` 派生で修飾キーを持たないため、
 * 修飾キーはイベントを組み立てたあとに与える。
 */
export function wheel(
  element: Element,
  delta: Offset,
  modifier: PressedModifier,
): void {
  const event = new WheelEvent("wheel", {
    deltaX: delta.x,
    deltaY: delta.y,
    bubbles: true,
    cancelable: true,
  });
  const keys = modifierKeysOf(modifier);
  Object.defineProperty(event, "ctrlKey", { value: keys.ctrlKey });
  Object.defineProperty(event, "metaKey", { value: keys.metaKey });
  Object.defineProperty(event, "altKey", { value: keys.altKey });
  fireEvent(element, event);
}

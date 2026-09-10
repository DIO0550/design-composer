import { fireEvent } from "@testing-library/react";
import type { Offset } from "@/domains/unit/offset";

/**
 * キャンバスへのポインタ / ホイール操作。キャンバス本体・ズーム / パンのフック・編集画
 * 面の通しから使うため、feature 直下に置いて共有する（外の feature へはテスト用の公開口
 * から出す）。
 *
 * ポインタそのものの操作は左ペインの並べ替えでも同じものが要るので、横断層（`components/__tests__/pointer-gesture`）
 * へ移して**そのまま再輸出**する。包み直さないのは、`Offset` が `PointerPoint` と構造的
 * に同じで型の上でも何も足せないため。ここが自前で持つのはホイール（キャンバス固有）だ
 * け。
 */

export {
  drag,
  movePointer,
  pressPointer,
  releasePointer,
} from "@/components/__tests__/pointer-gesture";

/**
 * パンの修飾キーを押す / 離す。
 *
 * `document` へ撃つのは `useSpaceHeld` がそこで待っているため（ページ全体の関心事）。
 * `code` で撃つのは、フックが打たれた文字ではなく物理キーで見ているのに合わせる。
 */
export function holdSpace(): void {
  fireEvent.keyDown(globalThis.document, { code: "Space", key: " " });
}

export function releaseSpace(): void {
  fireEvent.keyUp(globalThis.document, { code: "Space", key: " " });
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
  delta: Offset,
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

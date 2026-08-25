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
 * （`components/__tests__/pointer-gesture`）へ移して**そのまま再輸出**する。
 * 包み直さないのは、`CanvasOffset` が `PointerPoint` と構造的に同じで型の上でも
 * 何も足せないため（rules/coding.md「構造が変わらない型エイリアスの新設は禁止」と
 * 同じ形）。ここが自前で持つのはホイール（キャンバス固有）だけ。
 */

export {
  drag,
  movePointer,
  pressPointer,
  releasePointer,
} from "@/components/__tests__/pointer-gesture";

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

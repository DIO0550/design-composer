import type { PointerEvent as ReactPointerEvent } from "react";
import type { Offset } from "@/domains/unit/offset";

/**
 * キャンバス上のポインタイベントの読み取り。
 * 1 箇所に集めるのは、`event.clientX` を直に読んでも型・テスト・lint のどれも止めないため。
 */
export const CanvasPointer = {
  /**
   * イベントが起きた位置。
   * キャンバスの実測（`getBoundingClientRect`）と揃えるため client 座標で読む。
   */
  offsetOf(event: ReactPointerEvent<HTMLElement>): Offset {
    return { x: event.clientX, y: event.clientY };
  },
} as const;

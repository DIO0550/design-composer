import type { PointerEvent as ReactPointerEvent } from "react";
import type { Offset } from "@/domains/unit/offset";

/**
 * キャンバス上のポインタイベントの読み取り。
 * ズーム / パン・移動・リサイズの各フックが同じ読み方をするため 1 箇所に集める。
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

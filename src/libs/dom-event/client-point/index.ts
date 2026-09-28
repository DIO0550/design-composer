import type { Offset } from "@/domains/unit/offset";

/** 窓の座標を持つイベント。マウスとポインタのどちらのイベントもこの形で届く。 */
type ClientPositionedEvent = Readonly<{
  clientX: number;
  clientY: number;
}>;

/**
 * イベントが起きた位置を、窓の左上を原点にした座標として読む。
 */
export const ClientPoint = {
  /**
   * イベントが起きた位置。
   *
   * @param event 窓の座標を持つイベント
   * @returns 窓の左上を原点にしたイベントの位置
   */
  fromEvent(event: ClientPositionedEvent): Offset {
    return { x: event.clientX, y: event.clientY };
  },
} as const;

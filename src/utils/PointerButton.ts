import type { ValueOf } from "@/types/ValueOf";

/**
 * 押されたマウスのボタン（`PointerEvent.button` の値）。
 *
 * 並べるのは操作へ割り当てているものだけ。副ボタン（右）は数えない
 * （コンテキストメニューは未実装 / #418）。
 */
export const PointerButtons = {
  Primary: 0,
  Middle: 1,
} as const;

export type PointerButton = ValueOf<typeof PointerButtons>;

/** ボタンの押下だけを持つイベント。ポインタのどの段階からもこの形で届く。 */
type ButtonBearingEvent = Readonly<{
  button: number;
}>;

/**
 * どのボタンで始まった操作かを答える。
 *
 * `event.button` の綴りをここへ閉じるのは `CommandKey` と同じ形で、割り当てを読む側が
 * 数値を書かずに済むようにするため。
 */
export const PointerButton = {
  /**
   * 主ボタン（マウスの左・タッチ・ペン）で押されたか。
   *
   * @param event ボタンの押下を持つポインタ操作
   * @returns 主ボタンなら真
   */
  isPrimary(event: ButtonBearingEvent): boolean {
    return event.button === PointerButtons.Primary;
  },

  /**
   * 中ボタン（ホイールの押し込み）で押されたか。
   *
   * @param event ボタンの押下を持つポインタ操作
   * @returns 中ボタンなら真
   */
  isMiddle(event: ButtonBearingEvent): boolean {
    return event.button === PointerButtons.Middle;
  },
} as const;

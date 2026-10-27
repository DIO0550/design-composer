/** Alt / Option キー（macOS では Option、その他では Alt と刻まれている同じ修飾キー）。 */
export const AltKey = {
  /**
   * その操作で Alt / Option が押されていたか。
   *
   * @param event 修飾キーの押下を持つイベント
   * @returns Alt / Option が押されていれば真
   */
  isHeld(event: Readonly<{ altKey: boolean }>): boolean {
    return event.altKey;
  },
} as const;

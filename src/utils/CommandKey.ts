/**
 * 修飾キーの押下だけを持つイベント。キーボード / ホイール / ポインタのどれからも
 * この形で届くので、イベントの種類ごとに型を分けない。
 */
type ModifierBearingEvent = Readonly<{
  ctrlKey: boolean;
  metaKey: boolean;
}>;

/** OS をまたいで「コマンドキー」にあたる修飾キー（macOS の ⌘ と、その他の Ctrl）。 */
export const CommandKey = {
  /**
   * その操作でコマンドキーが押されていたか。
   *
   * ⌘ と Ctrl を区別しないのは、同じ割り当てを両方の OS で使うため
   * （docs/06-ui.md は `⌘] / Ctrl+]` のように 2 つを 1 つの割り当てとして書いている）。
   *
   * @param event 修飾キーの押下を持つイベント
   * @returns ⌘ か Ctrl のどちらかが押されていれば真
   */
  isHeld(event: ModifierBearingEvent): boolean {
    return event.ctrlKey || event.metaKey;
  },
} as const;

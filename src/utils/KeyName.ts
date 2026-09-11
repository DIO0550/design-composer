import type { ValueOf } from "@/types/ValueOf";

/**
 * 押されたキーの綴り（**`KeyboardEvent.key` の値**）。
 *
 * 並ぶのは名前を持つキーだけで、文字キー（`⌘C` の `"c"`、`⌘]` の `"]"` など）は入れない。
 * `event.key` は Shift や配列で綴りが変わる（`"z"` が `"Z"` になる）ので、文字で待ち受ける
 * 割り当ては大小を無視した突き合わせか物理キー（`event.code`）を使う側の話になる
 * （`hooks/use-key-shortcut`）。space は綴りが 1 文字だが名前で呼ぶので入れる。
 */
export const KeyNames = {
  Escape: "Escape",
  Enter: "Enter",
  Space: " ",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Delete: "Delete",
  Backspace: "Backspace",
} as const;

export type KeyName = ValueOf<typeof KeyNames>;

/** キーの綴りだけを持つイベント。DOM と React のどちらからもこの形で届く。 */
type KeyBearingEvent = Readonly<{
  key: string;
}>;

/** どのキーが押されたかを答える。 */
export const KeyName = {
  /**
   * 押されたキーがその並びに入っているか。
   *
   * @param names 待ち受けるキー
   * @param event キーの綴りを持つ操作
   * @returns 並びに入っていれば真
   */
  isOneOf(names: readonly KeyName[], event: KeyBearingEvent): boolean {
    return names.some((name) => name === event.key);
  },
} as const;

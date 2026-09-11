import { useEffect } from "react";
import { CommandKey } from "@/utils/CommandKey";
import { ElementEx } from "@/utils/ElementEx";

/**
 * 押下を割り当てへ結び付けるきっかけ。`TypedCharacter` は打たれた文字（`event.key`）、
 * `PhysicalKey` は押された物理キー（`event.code`）。
 *
 * 数字のショートカットは物理キーで待つ。
 */
export const KeyTriggers = {
  TypedCharacter: "typed-character",
  PhysicalKey: "physical-key",
} as const;

/**
 * どの割り当ても持つ修飾キーの条件。`withCommandKey` は Windows の Ctrl と macOS の
 * Command を同じ修飾として指し、`withShiftKey` は Shift の有無で別の操作になる割り当て
 * （undo と redo）を区別する。
 */
type KeyModifiers = Readonly<{
  withCommandKey: boolean;
  withShiftKey: boolean;
}>;

/**
 * ページ全体で受けるキーの組み合わせ。きっかけ（`kind`）で 2 つに分かれ、`keys` は打た
 * れた文字、`codes` は押された物理キーの綴り（`"Digit1"` など）を持つ。
 *
 * `codes` も同じ形にしてあるが、今のところどの割り当ても 1 件しか持たない。
 */
export type KeyShortcut = KeyModifiers &
  (
    | Readonly<{
        kind: typeof KeyTriggers.TypedCharacter;
        keys: readonly string[];
      }>
    | Readonly<{
        kind: typeof KeyTriggers.PhysicalKey;
        codes: readonly string[];
      }>
  );

/**
 * 押されたキーそのものが、この割り当ての待ち受ける並びに入っているか。
 * 修飾キーは見ない（見るのは `matches`）。
 *
 * @param shortcut きっかけと並びの出どころ
 * @param event 突き合わせるキー操作
 * @returns 待ち受けている並びに入っていれば `true`
 */
function pressesKeyOf(shortcut: KeyShortcut, event: KeyboardEvent): boolean {
  switch (shortcut.kind) {
    case KeyTriggers.TypedCharacter:
      // 大小を無視して比べる。Shift を押している間 `event.key` は打たれる文字、
      // つまり "z" ではなく "Z" になるため、そのまま比べると
      // Cmd+Shift+Z がどの割り当てにも当たらない。
      return shortcut.keys.some(
        (key) => key.toLowerCase() === event.key.toLowerCase(),
      );
    case KeyTriggers.PhysicalKey:
      // 物理キーの綴りは配列にも修飾キーにも依らないので、そのまま比べる。
      return shortcut.codes.includes(event.code);
  }
}

export const KeyShortcut = {
  /**
   * そのキー操作がこの組み合わせにあたるか。
   *
   * 修飾キーの有無まで一致を要求する。
   */
  matches(shortcut: KeyShortcut, event: KeyboardEvent): boolean {
    const matchesKey = pressesKeyOf(shortcut, event);
    const matchesCommandKey =
      CommandKey.isHeld(event) === shortcut.withCommandKey;
    const matchesShiftKey = event.shiftKey === shortcut.withShiftKey;

    return matchesKey && matchesCommandKey && matchesShiftKey;
  },

  /**
   * この割り当てが、フォーカスのある要素に食われるか。
   *
   * 文字を打ち込める場所ではどの割り当ても通さない（Backspace を割り当てたときに入力欄
   * の文字が消せなくなる）。選択欄で通さないのは修飾キーを伴わない割り当てだけで、`⌘Z`
   * まで止めると prop を選び直した直後に戻せなくなる。
   *
   * 移すと `utils/` が割り当ての語彙を持つ。
   *
   * @param shortcut 見ている割り当て
   * @param target キー操作の発火元
   * @returns フォーカスのある要素が受け取るなら `true`
   */
  isConsumedBy(shortcut: KeyShortcut, target: EventTarget | null): boolean {
    if (ElementEx.isTextEditable(target)) {
      return true;
    }
    return !shortcut.withCommandKey && ElementEx.isSelectControl(target);
  },
} as const;

/**
 * 1 件の割り当て。待ち受ける組み合わせと、押されたときに呼ぶ手続きの対。
 *
 * `KeyShortcut` が持つ並び（`keys` / `codes`）は前者しか表せないので、矢印 4 方向のように
 * 押したキーで呼ぶ相手が変わるものは、こちらを並べて渡す。
 */
export type KeyShortcutBinding = Readonly<{
  shortcut: KeyShortcut;
  onPress: () => void;
}>;

/**
 * ページ全体のキーボードショートカットを複数まとめて張り、当たった割り当てのうち先に並
 * んでいる 1 件だけを呼ぶ。フォーカスのある要素が受け取る間は無視する（`isConsumedBy`）。
 *
 * 当たった押下は既定動作を止める。一致した時点でその押下はアプリの操作なので、ブラウザ側
 * の動き（矢印のスクロール等）を重ねない。
 *
 * 購読は毎 render 張り直すので、安定させたいなら `bindings` を `useMemo` で渡す
 * （`onPress` を `useCallback` で包むだけでは効かない）。
 *
 * @param bindings 待ち受ける割り当ての並び
 */
export function useKeyShortcuts(bindings: readonly KeyShortcutBinding[]): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const bound = bindings.find(
        ({ shortcut }) =>
          KeyShortcut.matches(shortcut, event) &&
          !KeyShortcut.isConsumedBy(shortcut, event.target),
      );
      if (bound === undefined) {
        return;
      }
      event.preventDefault();
      bound.onPress();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [bindings]);
}

/**
 * ページ全体のキーボードショートカット。指定した組み合わせが押されたら `onPress` を呼ぶ
 * （割り当てが 1 件だけの `useKeyShortcuts`）。
 *
 * @param shortcut 待ち受けるキーの組み合わせ
 * @param onPress その組み合わせが押されたときに呼ぶ手続き
 */
export function useKeyShortcut(
  shortcut: KeyShortcut,
  onPress: () => void,
): void {
  useKeyShortcuts([{ shortcut, onPress }]);
}

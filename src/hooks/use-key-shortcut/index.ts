import { useEffect } from "react";
import { ElementEx } from "@/utils/ElementEx";

/**
 * ページ全体で受けるキーの組み合わせ。
 *
 * `keys` を並びで持つのは、同じ操作に複数のキーを割り当てる流儀があるため
 * （削除の Delete / Backspace）。
 * `withCommandKey` は Windows の Ctrl と macOS の Command の両方を指す。
 * どちらの流儀でも同じ操作ができるよう、2 つを同じ修飾として扱う。
 *
 * 割り当てるキーとフックを分けているのは、押されたかの判定に React が要らないため
 * （フック側はページ全体で受けることと購読の解除だけを持つ）。
 */
export type KeyShortcut = Readonly<{
  keys: readonly string[];
  withCommandKey: boolean;
}>;

export const KeyShortcut = {
  /**
   * そのキー操作がこの組み合わせにあたるか。
   *
   * 修飾キーの有無まで一致を要求する。緩めると Cmd+C が
   * 「修飾なしの c」に割り当てたショートカットまで叩いてしまうため。
   */
  matches(shortcut: KeyShortcut, event: KeyboardEvent): boolean {
    return (
      shortcut.keys.includes(event.key) &&
      (event.ctrlKey || event.metaKey) === shortcut.withCommandKey
    );
  },
} as const;

/**
 * ページ全体のキーボードショートカット。指定した組み合わせが押されたら `onPress` を呼ぶ。
 *
 * 押す対象が特定の要素ではなく画面のどこにフォーカスがあっても効く操作なので、
 * 要素の `onKeyDown` では受けられず `document` に張る（rules/hooks.md の
 * 「本質的にグローバルな関心事」）。
 *
 * 文字を打ち込んでいる最中のキーは無視する。Backspace のような編集キーを
 * ショートカットに割り当てたとき、入力欄の文字が消せなくなるため。
 * この扱いはどのショートカットにも共通なので、割り当てるキーの側ではなくここが持つ。
 */
export function useKeyShortcut(
  shortcut: KeyShortcut,
  onPress: () => void,
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!KeyShortcut.matches(shortcut, event)) {
        return;
      }
      if (ElementEx.isTextEditable(event.target)) {
        return;
      }
      onPress();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcut, onPress]);
}

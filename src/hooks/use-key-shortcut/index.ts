import { useEffect } from "react";
import { ElementEx } from "@/utils/ElementEx";

/**
 * ページ全体のキーボードショートカット。指定したキーが押されたら `onPress` を呼ぶ。
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
  keys: readonly string[],
  onPress: () => void,
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!keys.includes(event.key)) {
        return;
      }
      if (ElementEx.isTextEditable(event.target)) {
        return;
      }
      onPress();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [keys, onPress]);
}

import { useEffect } from "react";
import { ElementEx } from "@/utils/ElementEx";

/** 削除に割り当てるキー。Windows / macOS どちらの流儀でも消せるよう両方を受ける。 */
const DELETE_KEYS: readonly string[] = ["Delete", "Backspace"];

/**
 * 選択中のノードの削除をキーボードから行えるようにする
 * （docs/06-ui.md「編集操作の一覧」の削除 / #39）。
 *
 * 押す対象が特定の要素ではなく画面のどこにフォーカスがあっても効く操作なので、
 * 要素の `onKeyDown` では受けられず `document` に張る（rules/hooks.md の
 * 「本質的にグローバルな関心事」）。
 * 文字を打ち込んでいる最中の Backspace まで削除にすると、インライン編集や
 * プロパティパネルの入力が消せなくなるため、入力欄からのキーは無視する。
 */
export function useDeleteShortcut(onDelete: () => void): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!DELETE_KEYS.includes(event.key)) {
        return;
      }
      if (ElementEx.isTextEditable(event.target)) {
        return;
      }
      onDelete();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDelete]);
}

import { useClearSelectionShortcut } from "@/features/editor/hooks/use-clear-selection-shortcut";
import { useCopyShortcut } from "@/features/editor/hooks/use-copy-shortcut";
import { useDeleteShortcut } from "@/features/editor/hooks/use-delete-shortcut";
import { useEditActions } from "@/features/editor/hooks/use-edit-actions";
import { useNodeActions } from "@/features/editor/hooks/use-node-actions";
import { usePasteShortcut } from "@/features/editor/hooks/use-paste-shortcut";
import { useRedoShortcut } from "@/features/editor/hooks/use-redo-shortcut";
import { useReorderShortcut } from "@/features/editor/hooks/use-reorder-shortcut";
import { useRepositionShortcut } from "@/features/editor/hooks/use-reposition-shortcut";
import { useUndoShortcut } from "@/features/editor/hooks/use-undo-shortcut";

/**
 * 編集操作のキーボードショートカットをまとめて張る（docs/06-ui.md「編集操作の一覧」）。
 *
 * 削除（artboard の削除もこの導線）・コピー & ペースト・undo / redo・選択解除・並べ替
 * え・座標の移動を張る。
 *
 * 呼ぶ先は `useEditActions`（選択解除だけは `useNodeActions`）。同じ操作をコンテキストメニ
 * ューの行からも呼ぶので、割り当てから dispatch までを 2 箇所に書かない。
 *
 * 対象が無いときは状態側が「その操作は存在しない」と答える（各アクションの `none`）ので、
 * 押せるかどうかをここで判定しない。
 */
export function useEditShortcuts(): void {
  const edit = useEditActions();
  const node = useNodeActions();

  useDeleteShortcut(edit.removeSelected);
  useCopyShortcut(edit.copy);
  usePasteShortcut(edit.paste);
  useUndoShortcut(edit.undo);
  useRedoShortcut(edit.redo);
  useClearSelectionShortcut(node.clearSelection);
  useReorderShortcut(edit.reorderSelected);
  useRepositionShortcut(edit.repositionSelectedBy);
}

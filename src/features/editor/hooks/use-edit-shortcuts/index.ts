import { useEditor } from "@/features/editor/components/editor-provider";
import { useClearSelectionShortcut } from "@/features/editor/hooks/use-clear-selection-shortcut";
import { useCopyShortcut } from "@/features/editor/hooks/use-copy-shortcut";
import { useDeleteShortcut } from "@/features/editor/hooks/use-delete-shortcut";
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
 * このうち削除・コピー & ペースト・undo / redo は、画面にこれ以外の入口を持たない（選択解
 * 除と並べ替えはツリーとインスペクタからも呼ばれる）。削除のボタンは画面から外してあり、キ
 * ャンバスに浮かぶツールバーが持つのは追加の入口と運んでいることの表示だけ。
 *
 * 対象が無いときは状態側が「その操作は存在しない」と答える（各アクションの `none`）ので、
 * 押せるかどうかをここで判定しない。
 */
export function useEditShortcuts(): void {
  const { dispatch } = useEditor();

  useDeleteShortcut(() => dispatch({ type: "remove_selected" }));
  useCopyShortcut(() => dispatch({ type: "copy_node" }));
  usePasteShortcut(() => dispatch({ type: "paste_node" }));
  useUndoShortcut(() => dispatch({ type: "undo" }));
  useRedoShortcut(() => dispatch({ type: "redo" }));
  useClearSelectionShortcut(() => dispatch({ type: "clear_selection" }));
  useReorderShortcut((step) =>
    dispatch({ type: "reorder_selected_node", step }),
  );
  useRepositionShortcut((delta) =>
    dispatch({ type: "reposition_selected_node", delta }),
  );
}

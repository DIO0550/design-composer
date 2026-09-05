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
 * 編集操作のキーボードショートカットをまとめて張る
 * （docs/06-ui.md「編集操作の一覧」）。
 *
 * 削除（#39。artboard の削除もこの導線 / #43）・コピー & ペースト（#40）・
 * undo / redo（#41）・選択解除（#414）・並べ替え（#417）・座標の移動（#413）は
 * キーボードだけの操作。
 * UI 案（docs/Design Composer.html）が対応するボタンを持たないため、画面にも置いていない
 * （削除のボタンは #112 で外した。キャンバスに浮かぶツールバーが持つのは追加の入口
 * （`#` / `□` / `T`）と運んでいることの表示だけで、削除は持たない / #316）。
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

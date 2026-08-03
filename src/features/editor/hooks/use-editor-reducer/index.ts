import { type ActionDispatch, useReducer } from "react";
import type { ChildPosition, DesignDocument } from "@/domains/design-document";
import type { PropEdit } from "@/domains/node";
import type { DocumentReload } from "@/features/editor/domains/document-reload";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";

/** エディタ画面で起きる状態遷移（docs/06-ui.md「選択」「編集操作の一覧」）。 */
export type EditorAction =
  | Readonly<{ type: "select"; name: string }>
  | Readonly<{ type: "clear_selection" }>
  | Readonly<{ type: "reload_document"; reload: DocumentReload }>
  | Readonly<{
      type: "reorder_node";
      from: ChildPosition;
      toIndex: number;
    }>
  | Readonly<{ type: "apply_prop_edit"; edit: PropEdit }>;

/** アクションの解釈だけを行い、状態の組み立ては EditorState に委ねる。 */
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "select":
      return EditorState.select(state, action.name);
    case "clear_selection":
      return EditorState.clearSelection(state);
    case "reload_document":
      return EditorState.applyReload(state, action.reload);
    case "reorder_node":
      // 移動が存在しなければ並びは変わらない（EditorState.reorderNode の `none`）。
      return Option.unwrapOr(
        EditorState.reorderNode(state, action.from, action.toIndex),
        state,
      );
    case "apply_prop_edit":
      // 選択が無ければ編集は存在しない（EditorState.applyPropEdit の `none`）。
      return Option.unwrapOr(
        EditorState.applyPropEdit(state, action.edit),
        state,
      );
  }
}

/**
 * ドキュメントと選択は 1 つの操作で同時に変わる（読み直しで選択が外れる）ため、
 * useState を 2 つ並べずに reducer へ統合する（rules/hooks.md）。
 */
export function useEditorReducer(
  initialDocument: DesignDocument,
): [EditorState, ActionDispatch<[action: EditorAction]>] {
  return useReducer(editorReducer, initialDocument, EditorState.create);
}

import { type ActionDispatch, useReducer } from "react";
import type { ChildPosition, DesignDocument } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";

/** エディタ画面で起きる状態遷移（docs/06-ui.md「選択」「編集操作の一覧」）。 */
export type EditorAction =
  | Readonly<{ type: "select"; name: string }>
  | Readonly<{ type: "clear_selection" }>
  | Readonly<{ type: "load_document"; document: DesignDocument }>
  | Readonly<{
      type: "reorder_node";
      from: ChildPosition;
      toIndex: number;
    }>;

/** アクションの解釈だけを行い、状態の組み立ては EditorState に委ねる。 */
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "select":
      return EditorState.select(state, action.name);
    case "clear_selection":
      return EditorState.clearSelection(state);
    case "load_document":
      return EditorState.loadDocument(state, action.document);
    case "reorder_node":
      // 移動が存在しなければ並びは変わらない（EditorState.reorderNode の `none`）。
      return Option.unwrapOr(
        EditorState.reorderNode(state, action.from, action.toIndex),
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

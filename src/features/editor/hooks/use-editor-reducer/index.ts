import { type ActionDispatch, useReducer } from "react";
import type { AxisLength } from "@/domains/axis-length";
import type { ChildPosition } from "@/domains/child-position";
import type { DesignDocument } from "@/domains/design-document";
import type { PropEdit } from "@/domains/node";
import type { DocumentReload } from "@/features/editor/domains/document-reload";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { NodeTemplate } from "@/features/editor/domains/node-template";
import { Option } from "@/utils/Option";

/** エディタ画面で起きる状態遷移（docs/06-ui.md「選択」「編集操作の一覧」）。 */
export type EditorAction =
  | Readonly<{ type: "select"; name: string }>
  | Readonly<{ type: "select_innermost"; names: readonly string[] }>
  | Readonly<{ type: "clear_selection" }>
  | Readonly<{ type: "reload_document"; reload: DocumentReload }>
  | Readonly<{
      type: "reorder_node";
      from: ChildPosition;
      toIndex: number;
    }>
  | Readonly<{ type: "move_node"; name: string; to: ChildPosition }>
  | Readonly<{ type: "insert_node"; template: NodeTemplate }>
  | Readonly<{ type: "remove_node" }>
  | Readonly<{ type: "copy_node" }>
  | Readonly<{ type: "paste_node" }>
  | Readonly<{ type: "apply_prop_edit"; edit: PropEdit }>
  | Readonly<{ type: "resize"; size: AxisLength }>
  | Readonly<{ type: "undo" }>
  | Readonly<{ type: "redo" }>;

/** アクションの解釈だけを行い、状態の組み立ては EditorState に委ねる。 */
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "select":
      return EditorState.select(state, action.name);
    case "select_innermost":
      return EditorState.selectInnermost(state, action.names);
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
    case "move_node":
      // 動かせない先なら木は変わらない（EditorState.moveNode の `none`）。
      return Option.unwrapOr(
        EditorState.moveNode(state, action.name, action.to),
        state,
      );
    case "insert_node":
      // 挿せる位置が無ければ木は変わらない（EditorState.insertNode の `none`）。
      return Option.unwrapOr(
        EditorState.insertNode(state, action.template),
        state,
      );
    case "remove_node":
      /*
       * 消せる対象が無ければ木は変わらない（EditorState.removeNode の `none`）。
       * ボタンは選択が無いと押せないが、Delete キーはいつでも押せるため
       * この `none` には画面の操作から到達する。
       */
      return Option.unwrapOr(EditorState.removeNode(state), state);
    case "copy_node":
      /*
       * コピーできる対象が無ければクリップボードは変わらない
       * （EditorState.copyNode の `none`）。ボタンは選択が無いと押せないが、
       * ショートカットはいつでも押せるためこの `none` には画面の操作から到達する。
       */
      return Option.unwrapOr(EditorState.copyNode(state), state);
    case "paste_node":
      /*
       * クリップボードが空・挿せる位置が無ければ木は変わらない
       * （EditorState.pasteNode の `none`）。到達しうる理由は copy_node と同じ。
       */
      return Option.unwrapOr(EditorState.pasteNode(state), state);
    case "apply_prop_edit":
      // 選択が無ければ編集は存在しない（EditorState.applyPropEdit の `none`）。
      return Option.unwrapOr(
        EditorState.applyPropEdit(state, action.edit),
        state,
      );
    case "resize":
      // 選択が無ければリサイズは存在しない（EditorState.resize の `none`）。
      return Option.unwrapOr(EditorState.resize(state, action.size), state);
    case "undo":
      /*
       * 戻る先が無ければ状態は変わらない（EditorState.undo の `none`）。
       * ショートカットはいつでも押せるため、開いた直後に押すとここへ到達する。
       */
      return Option.unwrapOr(EditorState.undo(state), state);
    case "redo":
      // やり直す先が無ければ状態は変わらない（到達しうる理由は undo と同じ）。
      return Option.unwrapOr(EditorState.redo(state), state);
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

import { type ActionDispatch, useReducer } from "react";
import type { AxisLength } from "@/domains/axis-length";
import type { ChildPosition } from "@/domains/child-position";
import type { DesignDocument } from "@/domains/design-document";
import type { Instant } from "@/domains/instant";
import type { PropEdit } from "@/domains/node";
import type { TokenRef, TokenValue } from "@/domains/token";
import type { DocumentReload } from "@/features/editor/domains/document-reload";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { NodeTemplate } from "@/features/editor/domains/node-template";
import type { TokenTemplate } from "@/features/editor/domains/token-template";
import { Option } from "@/utils/Option";

/** エディタ画面で起きる状態遷移（docs/06-ui.md「選択」「編集操作の一覧」）。 */
export type EditorAction =
  | Readonly<{ type: "select"; name: string }>
  | Readonly<{ type: "select_innermost"; names: readonly string[] }>
  | Readonly<{ type: "clear_selection" }>
  | Readonly<{ type: "reveal"; name: string }>
  /*
   * 受け取った時刻を載せるのは、reducer が純粋関数でなければならず、その中で時計を
   * 読めないため（rules/hooks.md「reducer 内での I/O・副作用は禁止」）。
   */
  | Readonly<{ type: "reload_document"; reload: DocumentReload; at: Instant }>
  | Readonly<{ type: "revert_file" }>
  | Readonly<{
      type: "reorder_node";
      from: ChildPosition;
      toIndex: number;
    }>
  | Readonly<{ type: "move_node"; name: string; to: ChildPosition }>
  | Readonly<{ type: "insert_node"; template: NodeTemplate }>
  | Readonly<{ type: "remove_node" }>
  | Readonly<{ type: "detach_instance" }>
  | Readonly<{ type: "select_all_instances" }>
  | Readonly<{ type: "create_component"; componentName: string }>
  | Readonly<{ type: "copy_node" }>
  | Readonly<{ type: "paste_node" }>
  | Readonly<{ type: "apply_prop_edit"; edit: PropEdit }>
  | Readonly<{ type: "resize"; size: AxisLength }>
  | Readonly<{ type: "undo" }>
  | Readonly<{ type: "redo" }>
  | Readonly<{ type: "select_token"; ref: TokenRef }>
  | Readonly<{ type: "add_token"; template: TokenTemplate }>
  | Readonly<{ type: "set_token_value"; value: TokenValue }>
  | Readonly<{ type: "rename_token"; name: string }>
  | Readonly<{ type: "remove_token" }>;

/**
 * アクションの解釈だけを行い、状態の組み立ては EditorState に委ねる。
 *
 * @param state 今のエディタの状態
 * @param action 解釈するアクション
 * @returns 遷移後のエディタの状態
 */
function applyAction(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "select":
      return EditorState.select(state, action.name);
    case "select_innermost":
      return EditorState.selectInnermost(state, action.names);
    case "clear_selection":
      return EditorState.clearSelection(state);
    case "reveal":
      /*
       * 飛び先が表示中のドキュメントに無ければ選択は変わらない
       * （EditorState.reveal の `none`）。エラー行の Reveal はファイルが不正な間に
       * 押せるので、この `none` には画面の操作から到達する。
       */
      return Option.unwrapOr(EditorState.reveal(state, action.name), state);
    case "reload_document":
      return EditorState.applyReload(state, action.reload, action.at);
    case "revert_file":
      return EditorState.applyRevert(state);
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
    case "detach_instance":
      /*
       * インスタンスを選んでいなければ木は変わらない
       * （EditorState.detachInstance の `none`）。解除のボタンはインスタンスを
       * 選んでいるときにしか出ないため、画面の操作からこの `none` に到達するのは
       * 参照先の部品が壊れている（無い・循環している）ときだけ。
       */
      return Option.unwrapOr(EditorState.detachInstance(state), state);
    case "select_all_instances":
      /*
       * インスタンスを選んでいなければ選択は変わらない
       * （EditorState.selectAllInstances の `none`）。このボタンはインスタンスを
       * 選んでいるときにしか出ないため、画面の操作からこの `none` には到達しない。
       */
      return Option.unwrapOr(EditorState.selectAllInstances(state), state);
    case "create_component":
      /*
       * 部品にできない選択・使えない名前では木は変わらない
       * （EditorState.createComponent の `none`）。部品化のボタンは
       * `EditorState.createComponent(state, 下書き).some` が偽の間は押せないため、
       * 画面の操作からこの `none` には到達しない。
       */
      return Option.unwrapOr(
        EditorState.createComponent(state, action.componentName),
        state,
      );
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
       * 戻る先が無ければ何も変わらない（EditorState.undo の `none`）。
       * ショートカットは履歴が空でも押せるため、この `none` には画面の操作から到達する。
       */
      return Option.unwrapOr(EditorState.undo(state), state);
    case "redo":
      // 進む先が無ければ何も変わらない（EditorState.redo の `none`）。到達しうる理由は undo と同じ。
      return Option.unwrapOr(EditorState.redo(state), state);
    case "select_token":
      return EditorState.selectToken(state, action.ref);
    case "add_token":
      /*
       * 追加できなければトークンは変わらない（EditorState.addToken の `none`）。
       * 名前は種別の中で衝突しないよう採番されるため、画面の操作からこの `none` には到達しない。
       */
      return Option.unwrapOr(
        EditorState.addToken(state, action.template),
        state,
      );
    case "set_token_value":
      // 選択が無ければ編集は存在しない（EditorState.setTokenValue の `none`）。
      return Option.unwrapOr(
        EditorState.setTokenValue(state, action.value),
        state,
      );
    case "rename_token":
      /*
       * 規則を満たさない名前・種別の中で重複する名前では改名しない
       * （EditorState.renameToken の `none`）。名前の入力欄はどんな文字列も打てるため、
       * この `none` には画面の操作から到達する。
       */
      return Option.unwrapOr(
        EditorState.renameToken(state, action.name),
        state,
      );
    case "remove_token":
      // 選択が無ければ削除は存在しない（EditorState.removeToken の `none`）。
      return Option.unwrapOr(EditorState.removeToken(state), state);
  }
}

/**
 * エディタの状態を 1 つ持ち、アクションで進める。
 *
 * ドキュメントと選択は 1 つの操作で同時に変わる（読み直しで選択が外れる）ため、
 * `useState` を 2 つ並べず 1 つの状態へ統合している（rules/hooks.md）。
 *
 * @param initialDocument 開いた直後のドキュメント
 * @returns 今のエディタの状態と、アクションの送り先
 */
export function useEditorState(
  initialDocument: DesignDocument,
): [EditorState, ActionDispatch<[action: EditorAction]>] {
  return useReducer(applyAction, initialDocument, EditorState.create);
}

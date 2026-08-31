import { type ActionDispatch, useReducer } from "react";
import type { AxisLength } from "@/domains/dcmp/axis-length";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import type { DesignDocument } from "@/domains/dcmp/design-document";
import type { PropEdit } from "@/domains/dcmp/node";
import type { AbsolutePlacement } from "@/domains/dcmp/placement";
import type { TokenRef, TokenValue } from "@/domains/dcmp/token";
import type { DocumentReload } from "@/domains/session/document-reload";
import type { NodeTemplate } from "@/domains/session/node-template";
import type { Instant } from "@/domains/unit/instant";
import type { Offset } from "@/domains/unit/offset";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { TokenTemplate } from "@/features/editor/domains/token-template";
import type { IndexMove } from "@/types/IndexMove";
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
  | Readonly<{
      type: "reposition_node";
      name: string;
      placement: AbsolutePlacement;
    }>
  /* artboard をキャンバス上の別の位置へ置き直す経路（#390）。ノードの座標とは別の座標系。 */
  | Readonly<{
      type: "reposition_artboard";
      name: string;
      canvasPosition: Offset;
    }>
  | Readonly<{ type: "insert_node"; template: NodeTemplate }>
  /* 落とした先へ挿す経路。挿す位置が選択ではなくドロップ位置で決まる（#203）。 */
  | Readonly<{
      type: "insert_node_at";
      template: NodeTemplate;
      at: ChildPosition;
    }>
  | Readonly<{ type: "remove_selected" }>
  | Readonly<{ type: "add_artboard" }>
  | Readonly<{ type: "reorder_artboard"; move: IndexMove }>
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
    case "reposition_node":
      // 置き直せない指定なら座標は変わらない（EditorState.reposition の `none`）。
      return Option.unwrapOr(
        EditorState.reposition(state, action.name, action.placement),
        state,
      );
    case "reposition_artboard":
      // 相手が artboard でなければ位置は変わらない（EditorState.repositionArtboard の `none`）。
      return Option.unwrapOr(
        EditorState.repositionArtboard(
          state,
          action.name,
          action.canvasPosition,
        ),
        state,
      );
    case "insert_node":
      // 挿せる位置が無ければ木は変わらない（EditorState.insertNode の `none`）。
      return Option.unwrapOr(
        EditorState.insertNode(state, action.template),
        state,
      );
    case "insert_node_at":
      /*
       * 落とし先が受け入れられない位置なら木は変わらない
       * （EditorState.insertNodeAt の `none`）。落とし先は描かれている親と子から
       * 決まる（`DropZone`）ので、画面の操作から居ない親・範囲外の位置には到達しない。
       * ファイルが不正な間は `none` だが、そのとき左ペインは `inert` なので掴めない。
       */
      return Option.unwrapOr(
        EditorState.insertNodeAt(state, action.template, action.at),
        state,
      );
    case "remove_selected":
      /*
       * 消せる対象が無ければドキュメントは変わらない（EditorState.removeSelected の
       * `none`）。Delete キーは何も選んでいなくても押せるため、この `none` には
       * 画面の操作から到達する。ファイルが不正な間も `none`
       * （凍結は `inert` で作るが、キーは `document` に張るので素通りする / #155）。
       */
      return Option.unwrapOr(EditorState.removeSelected(state), state);
    case "add_artboard":
      /*
       * ファイルが不正な間は増えない（EditorState.addArtboard の `none`）。
       * そのとき左ペインは `inert` なので、画面の操作からこの `none` には到達しない。
       */
      return Option.unwrapOr(EditorState.addArtboard(state), state);
    case "reorder_artboard":
      /*
       * 移動が存在しなければ並びは変わらない（EditorState.reorderArtboard の `none`）。
       * 一覧は隣がいない向きのボタンを出さないため、画面の操作からこの `none` には
       * 到達しない（reorder_node と同じ扱い）。
       */
      return Option.unwrapOr(
        EditorState.reorderArtboard(state, action.move),
        state,
      );
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
       * 部品にできない選択・使えない名前・ファイルが不正な間は木は変わらない
       * （EditorState.createComponent の `none`）。部品化のボタンは
       * `Componentization.forSelection` が `ready` でない・
       * `DesignDocument.isUsableName(下書き)` が偽・凍結中のいずれかの間は押せないため、
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
       * ファイルが不正な間も `none`。コピーは通るが貼り付けは止まる
       * （クリップボードはドキュメントを変えない / #155）。
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
       * ファイルが不正な間も `none`（戻した内容が自動保存へ流れるため / #155）。
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

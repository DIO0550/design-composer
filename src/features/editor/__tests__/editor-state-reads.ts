import type { ChildPosition } from "@/domains/dcmp/child-position";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { Node } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/session/document-selection";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";

/*
 * エディタの状態から、開いている文書のノードと選択を読む。`editor-state` のテストと、
 * エディタの状態を Provider から読むフックのテストが同じ読み方をする。
 */

/**
 * 名前で引いたノード。見つからなければテストを落とす。
 *
 * @param state 引き先のエディタの状態
 * @param name 引きたいノードの名前
 * @returns そのノード
 */
export function nodeNamed(state: EditorState, name: string): Node {
  return Option.unwrap(
    DesignDocument.findNode(EditorState.document(state), name),
  );
}

/**
 * 名前で指したノードが、どの親の何番目の子として置かれているか。
 *
 * @param state 引き先のエディタの状態
 * @param name 位置を読みたいノードの名前
 * @returns その親の名前と index。画面構造に無ければ（部品定義の中のノードも）「無し」
 */
export function childPositionNamed(
  state: EditorState,
  name: string,
): Option<ChildPosition> {
  return DesignDocument.findChildPosition(EditorState.document(state), name);
}

/**
 * 選んでいるものの名前。
 *
 * @param state 読み先のエディタの状態
 * @returns 選んでいる名前の並び。何も選んでいなければ空
 */
export function selectedNames(state: EditorState): readonly string[] {
  return DocumentSelection.names(EditorState.documentSelection(state));
}

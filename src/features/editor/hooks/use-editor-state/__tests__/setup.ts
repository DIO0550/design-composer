import { DesignDocument } from "@/domains/dcmp/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";

/**
 * `home` の子の名前。器はどれも artboard 1 枚の下でツリーを編集するので、結果はここを読
 * めば分かる。
 *
 * @param state 読み先のエディタの状態
 * @returns `home` の子の名前を並び順のまま。`home` が居なければテストを落とす
 */
export function homeChildNames(state: EditorState): readonly string[] {
  return Option.unwrap(
    DesignDocument.findChildren(EditorState.document(state), "home"),
  ).map((child) => child.name);
}

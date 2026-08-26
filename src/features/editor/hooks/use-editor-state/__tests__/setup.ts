import { DesignDocument } from "@/domains/dcmp/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";

/**
 * `home` の子の名前。器はどれも artboard 1 枚の下でツリーを編集するので、
 * 結果はここを読めば分かる。
 *
 * Why not: 同フォルダの `childNamesOf`（`.detach`）と 1 本に畳んでいない。あちらが読む
 * のは**解除前の参照ノード**で、`findChildren` は子を持てないノードに `none` を返すため
 * （`NodeTree.allowsChildren` はプリミティブのみ）、ここと同じ `unwrap` にすると落ちる。
 *
 * @param state 読み先のエディタの状態
 * @returns `home` の子の名前を並び順のまま。`home` が居なければテストを落とす
 */
export function homeChildNames(state: EditorState): readonly string[] {
  return Option.unwrap(
    DesignDocument.findChildren(EditorState.document(state), "home"),
  ).map((child) => child.name);
}

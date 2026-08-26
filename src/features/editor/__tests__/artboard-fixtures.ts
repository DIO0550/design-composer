import { DesignDocument } from "@/domains/dcmp/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";

/**
 * artboard を 3 枚持ち、先頭の `home` だけが子を持つドキュメント。
 *
 * 3 枚あるのは、隣り合わない移動（`0 → 2`）を確かめるため。2 枚だと移動元と
 * 移動先を取り違えても同じ並びになり、受け渡しの取り違えを区別できない。
 * 子を持たせてあるのは、artboard の削除が配下ごと消すことを空の artboard では
 * 確かめられないため。
 *
 * `features/editor/__tests__` に置くのは、状態（`editor-state`）とフック
 * （`use-editor-state`）の両方が同じ並びを要るため（`sample-document` と同じ扱い）。
 *
 * @returns artboard が 3 枚並ぶドキュメント
 */
export function documentWithThreeArtboards(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [{ name: "home-title", type: "Text" }],
      },
      { name: "settings", width: 375, height: 812, children: [] },
      { name: "about", width: 375, height: 812, children: [] },
    ],
  });
}

/**
 * `documentWithThreeArtboards` を開いた直後のエディタの状態。
 *
 * @returns artboard が 3 枚並ぶエディタの状態
 */
export function stateWithThreeArtboards(): EditorState {
  return EditorState.create(documentWithThreeArtboards());
}

/**
 * ドキュメントが持つ artboard の名前を並び順のまま。
 *
 * @param document 読み出し元のドキュメント
 * @returns artboard の名前の並び
 */
export function artboardNames(document: DesignDocument): readonly string[] {
  return document.artboards.map((artboard) => artboard.name);
}

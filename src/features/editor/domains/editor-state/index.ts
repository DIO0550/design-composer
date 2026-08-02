import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";

/**
 * エディタ画面が保持する状態（docs/06-ui.md「画面構成」「選択」）。
 * 選択はファイルへ保存しない実行時のみの状態だが、
 * 「どのドキュメントの中の名前か」でしか意味を持たないためドキュメントと同じ器に持つ。
 */
export type EditorState = Readonly<{
  document: DesignDocument;
  selectedName: Option<string>;
}>;

/**
 * 選択できるのはキャンバスに描かれるもの、つまり artboard とその配下のノードに限る。
 * 部品定義（components）は名前空間こそ共有するが、キャンバス上の実体ではないため対象にしない。
 */
function selectableName(
  document: DesignDocument,
  name: string,
): Option<string> {
  const isSelectable =
    DesignDocument.findArtboard(document, name).some ||
    DesignDocument.findNode(document, name).some;
  return isSelectable ? Option.some(name) : Option.none;
}

export const EditorState = {
  /** 選択なしの状態から始める（選択は非永続なので開いた直後は何も選ばれていない）。 */
  create(document: DesignDocument): EditorState {
    return { document, selectedName: Option.none };
  },

  /**
   * 選択を切り替える。ドキュメントに存在しない名前は選択状態にしない
   * （「存在しないものが選択されている」状態を作らないため、選択が外れる）。
   */
  select(state: EditorState, name: string): EditorState {
    return { ...state, selectedName: selectableName(state.document, name) };
  },

  clearSelection(state: EditorState): EditorState {
    return { ...state, selectedName: Option.none };
  },

  /**
   * ドキュメントを読み直す。選択は name によるベストエフォートで引き継ぎ、
   * 読み直したドキュメントに無くなっていれば外す（docs/06-ui.md「選択」）。
   */
  loadDocument(state: EditorState, document: DesignDocument): EditorState {
    return {
      document,
      selectedName: Option.flatMap(state.selectedName, (name) =>
        selectableName(document, name),
      ),
    };
  },

  isSelected(state: EditorState, name: string): boolean {
    return state.selectedName.some && state.selectedName.value === name;
  },
} as const;

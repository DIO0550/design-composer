import { type ChildPosition, DesignDocument } from "@/domains/design-document";
import type { PropEdit } from "@/domains/node";
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

  /**
   * 同じ親の中で子の順序を入れ替える（docs/06-ui.md「編集操作の一覧」の並べ替え）。
   *
   * 動かせない指定（親が無い・移動先が並びの外）は「その移動が存在しない」ことと同じなので
   * `none` にする。ツリービューは隣がいない向きの移動ボタンを出さないため、
   * 画面の操作からこの `none` には到達しない。
   * 選択はノードの name で持っており並べ替えでは変わらないため、そのまま引き継ぐ。
   */
  reorderNode(
    state: EditorState,
    from: ChildPosition,
    toIndex: number,
  ): Option<EditorState> {
    const reordered = DesignDocument.reorderNode(state.document, from, toIndex);
    return reordered.ok
      ? Option.some({ ...state, document: reordered.value })
      : Option.none;
  },

  /**
   * 選択中の artboard / ノードの prop を書き換える（docs/06-ui.md「編集操作の一覧」）。
   *
   * 対象を引数で受け取らず選択から決めるのは、props 編集の導線がプロパティパネル、
   * つまり選択中のものを編集する画面しか無いため。名前を受け取れる形にすると
   * 「選択していないものを編集する」状態を呼び出し側が作れてしまう。
   * 選択が無い・書き換えられない指定は「その編集が存在しない」ことなので `none`。
   */
  applyPropEdit(state: EditorState, edit: PropEdit): Option<EditorState> {
    return Option.flatMap(state.selectedName, (name) => {
      const edited = DesignDocument.applyPropEdit(state.document, name, edit);
      return edited.ok
        ? Option.some({ ...state, document: edited.value })
        : Option.none;
    });
  },

  isSelected(state: EditorState, name: string): boolean {
    return state.selectedName.some && state.selectedName.value === name;
  },
} as const;

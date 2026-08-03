import { type ChildPosition, DesignDocument } from "@/domains/design-document";
import type { DocumentError } from "@/features/editor/domains/document-error";
import type { DocumentReload } from "@/features/editor/domains/document-reload";
import { Option } from "@/utils/Option";

/**
 * エディタ画面が保持する状態（docs/06-ui.md「画面構成」「選択」）。
 * 選択はファイルへ保存しない実行時のみの状態だが、
 * 「どのドキュメントの中の名前か」でしか意味を持たないためドキュメントと同じ器に持つ。
 *
 * `document` は常に「最後に正常だったドキュメント」で、外部変更を拒んでも差し替えない。
 * `errors` が空でない間は、画面に映っているものがファイルの現在の中身と違う
 * （docs/03-schema.md「不正ファイル時の挙動」）。
 */
export type EditorState = Readonly<{
  document: DesignDocument;
  selectedName: Option<string>;
  errors: readonly DocumentError[];
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
    return { document, selectedName: Option.none, errors: [] };
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
   * 外部変更の取り込み結果を状態へ反映する（docs/05-architecture.md「外部編集の検知」）。
   *
   * 取り込めたときは無条件にドキュメントを差し替える（自動保存により
   * GUI 側に未保存の変更は無い）。選択は name によるベストエフォートで引き継ぎ、
   * 読み直したドキュメントに無くなっていれば外す（docs/06-ui.md「選択」）。
   *
   * 拒んだときはドキュメントも選択もそのままにし、エラー一覧だけを載せ替える。
   * 正常 / 不正の 2 つの遷移を 1 つのメソッドで受けるのは、呼び出し側が
   * 「ドキュメントを差し替えたのにエラーが残っている」ような組み合わせを作れないようにするため。
   */
  applyReload(state: EditorState, reload: DocumentReload): EditorState {
    switch (reload.kind) {
      case "reloaded":
        return {
          document: reload.document,
          selectedName: Option.flatMap(state.selectedName, (name) =>
            selectableName(reload.document, name),
          ),
          errors: [],
        };
      case "rejected":
        return { ...state, errors: reload.errors };
    }
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

  isSelected(state: EditorState, name: string): boolean {
    return state.selectedName.some && state.selectedName.value === name;
  },
} as const;

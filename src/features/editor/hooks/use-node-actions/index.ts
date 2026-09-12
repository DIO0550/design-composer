import type { AxisLength } from "@/domains/dcmp/axis-length";
import type { ChildPlacement } from "@/domains/dcmp/child-placement";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import type { PropEdit } from "@/domains/dcmp/node";
import type { NodeTemplate } from "@/domains/session/node-template";
import type { SelectionDig } from "@/domains/session/selection-dig";
import type { Offset } from "@/domains/unit/offset";
import { useEditor } from "@/features/editor/components/editor-provider";
import { EditorState } from "@/features/editor/domains/editor-state";

/**
 * ツリー・キャンバス・プロパティパネルから届くノード編集の操作
 * （docs/06-ui.md「編集操作の一覧」「キャンバス直接操作」）。
 *
 * 判断そのものは `EditorState` が持ち、ここは読み出して渡すだけ（rules/hooks.md「hooks は
 * ドメインロジックを持たない」）。
 */
export type NodeActions = Readonly<{
  select: (name: string) => void;
  selectAt: (names: readonly string[], dig: SelectionDig) => void;
  /** キャンバスの範囲選択で、範囲に重なったものをまとめて選ぶ。 */
  selectNodes: (names: readonly string[]) => void;
  clearSelection: () => void;
  /** エラー行から、そのエラーが指すノードを見せる。 */
  reveal: (nodeName: string) => void;
  reorder: (from: ChildPosition, toIndex: number) => void;
  move: (name: string, to: ChildPosition) => void;
  /** 絶対配置のノードを、指した親の中の座標へ置き直す（親の付け替えは）。 */
  reposition: (name: string, to: ChildPlacement) => void;
  /** artboard をキャンバス上の別の位置へ置き直す。 */
  repositionArtboard: (name: string, canvasPosition: Offset) => void;
  resize: (sizes: readonly AxisLength[]) => void;
  editProp: (edit: PropEdit) => void;
  insert: (template: NodeTemplate) => void;
  /** パレットから運んできたものを、落とした先のツリー位置へ挿す。 */
  insertAt: (template: NodeTemplate, at: ChildPosition) => void;
  detachInstance: () => void;
  /** 同じ部品を指すインスタンスをまとめて選ぶ（`Select all N instances`）。 */
  selectAllInstances: () => void;
  createComponent: (componentName: string) => void;
  /** 行のダブルクリックで、その行のものを選んで名前の編集に入る。 */
  startRenamingAt: (name: string) => void;
  /** 名前の入力欄で打たれた名前を確定する。使えない名前なら編集は閉じない。 */
  rename: (newName: string) => void;
  /** 入力欄がフォーカスを失ったときに編集を終える。使えない名前なら取り消して閉じる。 */
  finishRenaming: (newName: string) => void;
  /** 名前の編集をやめる。 */
  cancelRenaming: () => void;
  isInsertEnabled: boolean;
}>;

/**
 * ノード編集の操作をエディタの状態へ仲介する。
 *
 * 削除・コピー & ペースト・undo / redo と、向きだけを指定する並べ替え・移動量だけを指定す
 * る座標の移動、対象を渡さない名前の編集の開始はここに含めない（`useEditActions`）。
 *
 * そちらはキーボードの割り当てとコンテキストメニューが共有する操作で、対象を渡さず状態から
 * 決めるので、同じ操作でも別のアクションになる。
 *
 * @returns 選択・prop の編集・挿入など、画面の部品から呼ぶ操作
 */
export function useNodeActions(): NodeActions {
  const { state, dispatch } = useEditor();

  return {
    select: (name) => dispatch({ type: "select", name }),
    /**
     * キャンバスは押された位置から外へ辿った名前と、押し方から決まった掘る量を渡す。
     * どこまで内側へ入るかは状態側の判断（`EditorState.selectAt`）。
     */
    selectAt: (names, dig) => dispatch({ type: "select_at", names, dig }),
    /**
     * 範囲に重なったものはキャンバスが実測から決めて渡す（描かれた位置は
     * ドキュメントからは分からない）。選べるものへの絞り込みは状態側の判断
     * （`EditorState.selectNodes`）。
     */
    selectNodes: (names) => dispatch({ type: "select_nodes", names }),
    clearSelection: () => dispatch({ type: "clear_selection" }),
    /*
     * `select` と分けているのは、エラーの飛び先が表示中のドキュメントに
     * 無いことがあるため（`EditorState.reveal` の doc）。
     */
    reveal: (nodeName) => dispatch({ type: "reveal", name: nodeName }),
    reorder: (from, toIndex) =>
      dispatch({ type: "reorder_node", from, toIndex }),
    /**
     * キャンバスのドラッグは、既定ではツリー内の移動
     * （docs/06-ui.md「キャンバス直接操作」）。
     */
    move: (name, to) => dispatch({ type: "move_node", name, to }),
    /**
     * 運んでいるノードが絶対配置なら、同じドラッグが座標の置き直しになる。どちらになるかはキャ
     * ンバス側が運んでいるノードの配置を見て決める。
     *
     * 落とし先の親も一緒に届くので、親をまたいで運べば付け替わる。
     */
    reposition: (name, to) => dispatch({ type: "reposition_node", name, to }),
    /**
     * artboard の見出し・背景を掴んだドラッグはキャンバス上の移動。
     */
    repositionArtboard: (name, canvasPosition) =>
      dispatch({ type: "reposition_artboard", name, canvasPosition }),
    /** リサイズハンドルのドラッグは選択中のものの大きさの変更（docs/06-ui.md）。 */
    resize: (sizes) => dispatch({ type: "resize", sizes }),
    /**
     * prop の編集はプロパティパネルとキャンバスのインライン編集の両方から届く
     * （どちらも選択中のものへの編集なので同じアクションで受ける）。
     */
    editProp: (edit) => dispatch({ type: "apply_prop_edit", edit }),
    insert: (template) => dispatch({ type: "insert_node", template }),
    /**
     * パレットからのドラッグは、落とした先へ挿すこと（UI 案 docs/Design Composer.html は
     * `Assets` を挿入がドラッグ専用の browse-only とする）。選択位置ではなく落とし先へ
     * 挿すので `insert` とは別のアクションになる。
     */
    insertAt: (template, at) =>
      dispatch({ type: "insert_node_at", template, at }),
    /**
     * インスタンスの解除は選択中のものへの操作なので、対象を渡さない
     * （UI 案 docs/Design Composer.html の `Detach instance`）。
     */
    detachInstance: () => dispatch({ type: "detach_instance" }),
    selectAllInstances: () => dispatch({ type: "select_all_instances" }),
    /**
     * 部品化も選択中のものへの操作なので、渡すのは新しい部品に付ける名前だけ
     * （docs/06-ui.md「部品化（Create Component）」の「操作時に部品名のみを入力させる」）。
     */
    createComponent: (componentName) =>
      dispatch({ type: "create_component", componentName }),
    /*
     * 行のダブルクリックは押された行を対象にするので、名前を渡す。対象を渡さない
     * `startRenaming`（メニューと ⌘R）とは別のアクションになる。
     */
    startRenamingAt: (name) => dispatch({ type: "start_renaming_at", name }),
    rename: (newName) => dispatch({ type: "rename_selected", name: newName }),
    finishRenaming: (newName) =>
      dispatch({ type: "finish_renaming", name: newName }),
    cancelRenaming: () => dispatch({ type: "cancel_renaming" }),
    /**
     * 挿入は選択中のものを起点にするため、押せるかどうかも選択から決まる
     * （docs/06-ui.md「編集操作の一覧」）。
     */
    isInsertEnabled: EditorState.insertPosition(state).some,
  };
}

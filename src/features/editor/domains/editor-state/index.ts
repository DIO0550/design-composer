import type { AxisLength } from "@/domains/axis-length";
import { ChildPosition } from "@/domains/child-position";
import { DesignDocument } from "@/domains/design-document";
import type { Node, PropEdit } from "@/domains/node";
import type { DocumentError } from "@/features/editor/domains/document-error";
import type { DocumentReload } from "@/features/editor/domains/document-reload";
import { EditHistory } from "@/features/editor/domains/edit-history";
import { NodeTemplate } from "@/features/editor/domains/node-template";
import { Option } from "@/utils/Option";

/**
 * エディタ画面が保持する状態（docs/06-ui.md「画面構成」「選択」）。
 * 選択はファイルへ保存しない実行時のみの状態だが、
 * 「どのドキュメントの中の名前か」でしか意味を持たないためドキュメントと同じ器に持つ。
 * `copiedNode` はアプリ内クリップボード（docs/06-ui.md「編集操作の一覧」の
 * コピー & ペースト）で、選択と同じく非永続・ドキュメント基準なのでここに置く。
 *
 * ドキュメントを裸で持たず `history` の現在地として持つのは、差し替える道を
 * `EditHistory.record` だけにして、履歴を積まずに書き換える経路を無くすため（#41）。
 * 表示に使うドキュメントは `EditorState.document`。
 *
 * 現在地は常に「最後に正常だったドキュメント」で、外部変更を拒んでも差し替えない。
 * `errors` が空でない間は、画面に映っているものがファイルの現在の中身と違う
 * （docs/03-schema.md「不正ファイル時の挙動」）。
 */
export type EditorState = Readonly<{
  history: EditHistory;
  selectedName: Option<string>;
  copiedNode: Option<Node>;
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

/**
 * 選択中のノード。
 * 選択できるものには artboard も含まれるが、artboard はノードではないので `none`。
 */
function selectedNode(state: EditorState): Option<Node> {
  return Option.flatMap(state.selectedName, (name) =>
    DesignDocument.findNode(EditorState.document(state), name),
  );
}

/**
 * 履歴の現在地が動いたことを状態へ反映する。ドキュメントが変わる経路はすべてここを通す。
 *
 * 選択は name によるベストエフォートで引き継ぎ、新しい現在地に無くなっていれば外す。
 * 選択を持ち回すのは編集・undo・外部変更の取り込みで共通の扱いなので、
 * 「存在しないものが選択されている」状態をここ 1 箇所で潰す（docs/06-ui.md「選択」）。
 * クリップボードは引き継ぐ。切り離された複製であり、貼るときに必ず採番し直すので、
 * ドキュメントが差し替わっても貼れる状態が壊れないため。
 */
function withHistory(state: EditorState, history: EditHistory): EditorState {
  return {
    ...state,
    history,
    selectedName: Option.flatMap(state.selectedName, (name) =>
      selectableName(history.present, name),
    ),
  };
}

/** 編集の結果を履歴へ積んで現在地にする。 */
function withEdit(state: EditorState, document: DesignDocument): EditorState {
  return withHistory(state, EditHistory.record(state.history, document));
}

export const EditorState = {
  /**
   * 選択なしの状態から始める（選択は非永続なので開いた直後は何も選ばれていない）。
   * クリップボードも同じく実行時のみの状態なので空で始まる。
   */
  create(document: DesignDocument): EditorState {
    return {
      history: EditHistory.create(document),
      selectedName: Option.none,
      copiedNode: Option.none,
      errors: [],
    };
  },

  /** 画面に映っているドキュメント（履歴の現在地）。 */
  document(state: EditorState): DesignDocument {
    return state.history.present;
  },

  /**
   * 選択を切り替える。ドキュメントに存在しない名前は選択状態にしない
   * （「存在しないものが選択されている」状態を作らないため、選択が外れる）。
   */
  select(state: EditorState, name: string): EditorState {
    return {
      ...state,
      selectedName: selectableName(EditorState.document(state), name),
    };
  },

  /**
   * 内側から外へ並べた候補のうち、選択できる最も内側のものを選ぶ。
   *
   * キャンバスは部品インスタンスの中身まで描くが、そこに出るのは部品定義側のノード名で、
   * ドキュメントの木（artboard の配下）には無いため選択の対象にならない。
   * 内側から順に見ることで、インスタンスの中を押したときはインスタンス自身が選ばれる。
   * どれも選択できなければ選択は外れる（`select` と同じ）。
   */
  selectInnermost(state: EditorState, names: readonly string[]): EditorState {
    const innermost = names.find(
      (name) => selectableName(EditorState.document(state), name).some,
    );
    return { ...state, selectedName: Option.fromNullable(innermost) };
  },

  clearSelection(state: EditorState): EditorState {
    return { ...state, selectedName: Option.none };
  },

  /**
   * 外部変更の取り込み結果を状態へ反映する（docs/05-architecture.md「外部編集の検知」）。
   *
   * 取り込めたときは無条件にドキュメントを差し替える（自動保存により
   * GUI 側に未保存の変更は無い）。選択とクリップボードの引き継ぎは編集と同じ扱い。
   *
   * 取り込みは履歴を捨てずに 1 つの編集として積む。外部の書き込みが GUI 側の変更を
   * 上書きしたとき、undo で直前のドキュメントへ戻せることが「GUI 側の失われた変更は
   * undo バッファから復元できる」の中身だから（docs/05-architecture.md「競合の解決」）。
   * 読み直した内容を新たな起点にして履歴を捨てると、この復元経路が無くなる。
   *
   * 拒んだときはドキュメントも選択もそのままにし、エラー一覧だけを載せ替える。
   * 正常 / 不正の 2 つの遷移を 1 つのメソッドで受けるのは、呼び出し側が
   * 「ドキュメントを差し替えたのにエラーが残っている」ような組み合わせを作れないようにするため。
   */
  applyReload(state: EditorState, reload: DocumentReload): EditorState {
    switch (reload.kind) {
      case "reloaded":
        return withEdit({ ...state, errors: [] }, reload.document);
      case "rejected":
        return { ...state, errors: reload.errors };
    }
  },

  /**
   * 1 つ前のドキュメントへ戻す（docs/06-ui.md「編集操作の一覧」の undo / #41）。
   *
   * 戻る先が無ければ「その undo は存在しない」ことなので `none`。
   * ショートカットは履歴が空でも押せるため、画面の操作からこの `none` に到達する。
   * 戻した結果は通常の編集と同じ経路でファイルへ自動保存される
   * （docs/05-architecture.md「保存モデル」）。
   */
  undo(state: EditorState): Option<EditorState> {
    return Option.map(EditHistory.undo(state.history), (history) =>
      withHistory(state, history),
    );
  },

  /**
   * undo で戻る前のドキュメントへ進める（docs/06-ui.md「編集操作の一覧」の redo / #41）。
   *
   * 進む先が無ければ `none`。到達しうる理由は `undo` と同じ。
   */
  redo(state: EditorState): Option<EditorState> {
    return Option.map(EditHistory.redo(state.history), (history) =>
      withHistory(state, history),
    );
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
    const reordered = DesignDocument.reorderNode(
      EditorState.document(state),
      from,
      toIndex,
    );
    return reordered.ok
      ? Option.some(withEdit(state, reordered.value))
      : Option.none;
  },

  /**
   * ノードを別の位置へ移す（docs/06-ui.md「キャンバス直接操作」の移動）。
   *
   * `to` はキャンバスが提示したドロップ先、つまり**移動前の並びを見て決めた**
   * 「どの Box の何番目の子として置くか」。実際に挿す位置への読み替えは
   * `ChildPosition.afterRemoving` が持つ。
   *
   * 動かせない指定（自分の子孫の下・親が居ない・範囲外）は「その移動が存在しない」
   * ことなので `none`。今いる位置を持たないもの（ドキュメントに無い名前・artboard 自身）
   * も同じく動かせない。キャンバスは受け入れられない先をハイライトしないため、
   * 画面の操作からこの `none` には到達しない。
   * 選択はノードの name で持っており移動では変わらないため、そのまま引き継ぐ。
   */
  moveNode(
    state: EditorState,
    name: string,
    to: ChildPosition,
  ): Option<EditorState> {
    const document = EditorState.document(state);
    const current = DesignDocument.findChildPosition(document, name);
    if (!current.some) {
      return Option.none;
    }
    const moved = DesignDocument.moveNode(
      document,
      name,
      ChildPosition.afterRemoving(to, current.value),
    );
    return moved.ok ? Option.some(withEdit(state, moved.value)) : Option.none;
  },

  /**
   * 選択位置へノードを挿すときの位置（docs/06-ui.md「編集操作の一覧」の挿入は
   * 「選択位置の子として追加」）。
   *
   * 選択が無いとき・選択が子を持てないノード（Text / インスタンス）のときは
   * 挿せる位置が無いので `none`。挿入のボタンはこれが `none` の間は出さないため、
   * 画面の操作から `insertNode` の `none` には到達しない。
   */
  insertPosition(state: EditorState): Option<ChildPosition> {
    return Option.flatMap(state.selectedName, (name) =>
      DesignDocument.appendPositionOf(EditorState.document(state), name),
    );
  },

  /**
   * 削除できる対象の名前。
   *
   * 選択できるものには artboard も含まれるが、artboard の削除は artboard 操作（#43）の
   * 担当なので、ここで消せるのは配下のノードだけ。
   */
  removableName(state: EditorState): Option<string> {
    return Option.map(selectedNode(state), (node) => node.name);
  },

  /**
   * 選択中のノードをサブツリーごとクリップボードへ入れる
   * （docs/06-ui.md「編集操作の一覧」のコピー & ペースト）。
   *
   * コピーはサブツリー単位なので対象はノードそのもの。artboard も選択できるが、
   * artboard はノードとして貼れない（artboard の複製は artboard 操作（#43）の担当）
   * ため `none` にする。
   * ドキュメントは変わらない。入れるのは切り離された複製なので、
   * この後に元のノードを消しても貼れる。
   */
  copyNode(state: EditorState): Option<EditorState> {
    return Option.map(selectedNode(state), (node) => ({
      ...state,
      copiedNode: Option.some(node),
    }));
  },

  /**
   * クリップボードの中身を選択位置の子として貼る（docs/06-ui.md「編集操作の一覧」）。
   *
   * 名前の付け替えは `DesignDocument.insertNodeCopy` が挿入と一体で行うため、
   * ここでは順序を組み立てない。
   * 選択は動かさない。挿入と同じ導線なので、続けて貼ったときの結果が
   * 挿入と食い違わないようにするため（`insertNode` と同じ理由）。
   */
  pasteNode(state: EditorState): Option<EditorState> {
    return Option.flatMap(state.copiedNode, (node) =>
      Option.flatMap(EditorState.insertPosition(state), (at) => {
        const pasted = DesignDocument.insertNodeCopy(
          EditorState.document(state),
          at,
          node,
        );
        return pasted.ok
          ? Option.some(withEdit(state, pasted.value))
          : Option.none;
      }),
    );
  },

  /**
   * 選択位置の子としてノードを挿す（docs/06-ui.md「編集操作の一覧」の挿入）。
   *
   * 名前の採番に要るのはドキュメント全体の名前なので、ノードの組み立ては挿入先が
   * 決まってから行う（`NodeTemplate` は名前を持たない）。
   * 選択は動かさない。続けて挿したときに兄弟が並ぶのが「選択位置の子として追加」の素直な
   * 繰り返しで、挿すたびに選択が内側へ移ると Box を足しただけで入れ子が深くなるため。
   */
  insertNode(state: EditorState, template: NodeTemplate): Option<EditorState> {
    return Option.flatMap(EditorState.insertPosition(state), (at) => {
      const document = EditorState.document(state);
      const node = NodeTemplate.toNode(
        template,
        DesignDocument.usedNames(document),
      );
      const inserted = DesignDocument.insertNode(document, at, node);
      return inserted.ok
        ? Option.some(withEdit(state, inserted.value))
        : Option.none;
    });
  },

  /**
   * 選択中のノードをサブツリーごと削除する（docs/06-ui.md「編集操作の一覧」）。
   *
   * 対象を引数で受け取らず選択から決めるのは `applyPropEdit` と同じ理由で、
   * 削除の導線が「選択中のものを消す」しか無いため。
   * 消したものは新しいドキュメントに無いので、選択は `withHistory` で外れる。
   */
  removeNode(state: EditorState): Option<EditorState> {
    return Option.flatMap(EditorState.removableName(state), (name) => {
      const removed = DesignDocument.removeNode(
        EditorState.document(state),
        name,
      );
      return removed.ok
        ? Option.some(withEdit(state, removed.value))
        : Option.none;
    });
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
      const edited = DesignDocument.applyPropEdit(
        EditorState.document(state),
        name,
        edit,
      );
      return edited.ok
        ? Option.some(withEdit(state, edited.value))
        : Option.none;
    });
  },

  /**
   * 選択中の artboard / ノードの大きさを変える
   * （docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。
   *
   * 対象を引数で受け取らず選択から決めるのは `applyPropEdit` と同じ理由で、
   * ハンドルが出るのが選択中のものだけだから。
   * 選択が無い・大きさを持たない指定は「そのリサイズが存在しない」ことなので `none`。
   * 選択は name で持っておりリサイズでは変わらないため、そのまま引き継ぐ。
   */
  resize(state: EditorState, size: AxisLength): Option<EditorState> {
    return Option.flatMap(state.selectedName, (name) => {
      const resized = DesignDocument.resize(
        EditorState.document(state),
        name,
        size,
      );
      return resized.ok
        ? Option.some(withEdit(state, resized.value))
        : Option.none;
    });
  },

  isSelected(state: EditorState, name: string): boolean {
    return state.selectedName.some && state.selectedName.value === name;
  },
} as const;

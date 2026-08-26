import { Artboard } from "@/domains/artboard";
import type { AxisLength } from "@/domains/axis-length";
import { ChildPosition } from "@/domains/child-position";
import { DesignDocument } from "@/domains/design-document";
import { DocumentError } from "@/domains/document-error";
import type { DocumentReload } from "@/domains/document-reload";
import { DocumentSelection } from "@/domains/document-selection";
import { FileValidity } from "@/domains/file-validity";
import type { Node, PropEdit } from "@/domains/node";
import { NodeTemplate } from "@/domains/node-template";
import { SelectionState } from "@/domains/selection-state";
import { Token, type TokenRef, TokenSet, TokenValue } from "@/domains/token";
import { TokenSelection } from "@/domains/token-selection";
import type { Instant } from "@/domains/unit/instant";
import { EditHistory } from "@/features/editor/domains/edit-history";
import { TokenTemplate } from "@/features/editor/domains/token-template";
import type { IndexMove } from "@/types/IndexMove";
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
 * `fileValidity` が `invalid` の間は、画面に映っているものがファイルの現在の中身と違う
 * （docs/03-schema.md「不正ファイル時の挙動」）。この間は編集を受け付けない。
 * 古い表示から作った内容を書き出すと、より新しい外部の書き込みを潰すため（#155）。
 *
 * ドキュメント自身の不正（アプリ内の編集で作ったもの）はここに持たず
 * `EditorState.documentErrors` で導出する（#128）。
 */
export type EditorState = Readonly<{
  history: EditHistory;
  selection: SelectionState;
  selectedToken: Option<TokenRef>;
  copiedNode: Option<Node>;
  fileValidity: FileValidity;
}>;

/**
 * 選択中のトークン。ドキュメントから消えていれば選択は無い。
 * `selection` と同時に立っていてよい。左ペインのタブ（Layers / Tokens）が
 * どちらを右ペインに映すかを決めるので、2 つは「それぞれのタブの中の選択」であって
 * 矛盾しないため（UI 案 docs/Design Composer.html の tokens 状態）。
 *
 * @param document 選択先を引くドキュメント
 * @param ref 選択されているトークンの種別と名前
 * @returns そのトークンが残っていれば `some`、消えていれば `none`
 */
function selectableToken(
  document: DesignDocument,
  ref: TokenRef,
): Option<TokenRef> {
  return Option.map(TokenSet.find(document.tokens, ref), Token.ref);
}

/**
 * 選択できるのはキャンバスに描かれるもの、つまり artboard とその配下のノードに限る。
 * 部品定義（components）は名前空間こそ共有するが、キャンバス上の実体ではないため対象にしない。
 *
 * @param document 選択先を引くドキュメント
 * @param name 選択されている名前
 * @returns artboard か配下のノードとして残っていれば `some`、無ければ `none`
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
 *
 * @param state 選択の出どころになるエディタの状態
 * @returns 選択中のノード。未選択と、選択が artboard のときは `none`
 */
function selectedNode(state: EditorState): Option<Node> {
  return Option.flatMap(EditorState.singleName(state), (name) =>
    DesignDocument.findNode(EditorState.document(state), name),
  );
}

/**
 * 履歴の現在地が動いたことを状態へ反映する。ドキュメントが変わる経路はすべてここを通す。
 *
 * 選択は name によるベストエフォートで引き継ぎ、新しい現在地に無くなっていれば外す。
 * 選択を持ち回すのは編集・undo・外部変更の取り込みで共通の扱いなので、
 * 「存在しないものが選択されている」状態をここ 1 箇所で潰す（docs/06-ui.md「選択」）。
 * 複数選択も同じ扱いで、残った名前だけで作り直す。3 件のうち 2 件が消えれば単一選択、
 * 全部消えれば未選択へ落ちるのは `SelectionState.create` が決める。
 * クリップボードは引き継ぐ。切り離された複製であり、貼るときに必ず採番し直すので、
 * ドキュメントが差し替わっても貼れる状態が壊れないため。
 *
 * @param state 反映元のエディタの状態
 * @param history 新しい現在地を持つ履歴
 * @returns 履歴が差し替わり、消えた選択が外れたエディタの状態
 */
function withHistory(state: EditorState, history: EditHistory): EditorState {
  return {
    ...state,
    history,
    selection: SelectionState.create(
      SelectionState.names(state.selection).filter(
        (name) => selectableName(history.present, name).some,
      ),
    ),
    selectedToken: Option.flatMap(state.selectedToken, (ref) =>
      selectableToken(history.present, ref),
    ),
  };
}

/**
 * 新しいドキュメントを履歴へ積んで現在地にする。凍結を見ない。
 *
 * `withEdit` と分けているのは、外部変更の取り込みが**凍結を解く側**だから。
 * 取り込みを `withEdit` に通すと、渡す時点で妥当性を `valid` へ差し替えてあるために
 * 必ず `some` になり、呼び出し側に永久に届かない `none` の分岐が増える。
 *
 * @param state 積む先のエディタの状態
 * @param document 現在地にするドキュメント
 * @returns 履歴に 1 件積まれ、それを現在地にしたエディタの状態
 */
function withDocument(
  state: EditorState,
  document: DesignDocument,
): EditorState {
  return withHistory(state, EditHistory.record(state.history, document));
}

/**
 * 編集の結果を履歴へ積んで現在地にする。
 *
 * ファイルが不正な間は編集そのものが存在しないので `none`。映っているのは最後に正常
 * だった表示で、そこへ加えた編集を書き出すと外部の書き込みを上書きしてしまうため
 * （UI 案 docs/Design Composer.html の Error 画面が `freezes rail / panels / toolbar`）。
 * ドキュメントが変わる経路をここ 1 箇所に絞っているので、編集を足しても凍結から漏れない。
 *
 * @param state 積む先のエディタの状態
 * @param document 編集後のドキュメント
 * @returns 履歴に 1 件積まれ、それを現在地にしたエディタの状態。
 *   ファイルが不正な間は `none`
 */
function withEdit(
  state: EditorState,
  document: DesignDocument,
): Option<EditorState> {
  return EditorState.isFileInvalid(state)
    ? Option.none
    : Option.some(withDocument(state, document));
}

export const EditorState = {
  /**
   * 選択なしの状態から始める（選択は非永続なので開いた直後は何も選ばれていない）。
   * クリップボードも同じく実行時のみの状態なので空で始まる。
   */
  create(document: DesignDocument): EditorState {
    return {
      history: EditHistory.create(document),
      selection: SelectionState.None,
      selectedToken: Option.none,
      copiedNode: Option.none,
      fileValidity: FileValidity.valid,
    };
  },

  /** 画面に映っているドキュメント（履歴の現在地）。 */
  document(state: EditorState): DesignDocument {
    return state.history.present;
  },

  /**
   * 映っているドキュメントと、その中で選ばれているものの対
   * （`DocumentSelection`。左ペインはこれだけで描ける）。
   *
   * 選択から決まる読み（`isSelected` / `names` / `singleName` / `sourceName` /
   * `isCurrentArtboard` / `singleSelection`）はすべてこの対が持つ。`EditorState` が
   * 委譲を置くのは、状態しか持っていない消費側が要る 3 つ（`singleName` /
   * `sourceName` / `isSelected`）だけで、対を受け取る側が直接引けるもの
   * （キャンバスが読む `names` / `isCurrentArtboard`、右ペインが読む
   * `singleSelection`）には置かない。選択がどう変わるか（`select` / `reveal` /
   * 履歴の取り込み）だけが `EditorState` に残る。
   *
   * @param state 選択とドキュメントの出どころ
   * @returns 今のドキュメントと選択の対
   */
  documentSelection(state: EditorState): DocumentSelection {
    return DocumentSelection.create(
      EditorState.document(state),
      state.selection,
    );
  },

  /**
   * 1 つだけ選んでいるときの、その名前。
   *
   * 単一選択を前提とする操作（削除・コピー・prop 編集・リサイズ・部品化・解除・
   * テキスト編集）はすべてこれを通す。複数選択で `none` になるので、「複数選んでいる
   * 間は単一前提の操作が成立しない」（docs/06-ui.md「選択」）が、消費側ごとの分岐では
   * なくこの 1 つで決まる。
   *
   * @param state 選択の出どころになるエディタの状態
   * @returns 単一選択ならその名前。未選択と複数選択では `none`
   */
  singleName(state: EditorState): Option<string> {
    return DocumentSelection.singleName(EditorState.documentSelection(state));
  },

  /**
   * 画面に映っているドキュメント自身の不正（#128）。使用中トークンの削除のように、
   * アプリ内の編集で作った dangling 参照がここに出る。
   *
   * 状態として持たないのは、ドキュメントと食い違ったエラー一覧を表現できなく
   * するため（rules/hooks.md「導出可能な値の state 化禁止」）。
   */
  documentErrors(state: EditorState): readonly DocumentError[] {
    return DocumentError.collectFrom(EditorState.document(state));
  },

  /**
   * ファイルが不正なまま残っているか（docs/03-schema.md「不正ファイル時の挙動」）。
   *
   * 真のあいだ、画面に映っているのはファイルの現在の中身ではなく最後に正常だった
   * ドキュメントなので、表示を凍結する側（キャンバスのスクリム・両ペインの淡色・
   * 上部バーのエラー表示 / #135）はこれを見て決める。編集を止める側（`withEdit` /
   * `undo` / `redo`）と自動保存も同じ妥当性を見る（#155）。
   *
   * 凍結するかどうかだけを尋ねる側（エラーも起点も要らない側）が `fileValidity` の
   * 直和を開かずに済むよう、判定はここに 1 つだけ置く。
   *
   * @param state ファイルの妥当性の出どころになるエディタの状態
   * @returns 外部変更を拒んだままなら `true`
   */
  isFileInvalid(state: EditorState): boolean {
    return FileValidity.isInvalid(state.fileValidity);
  },

  /**
   * 選択を切り替える。ドキュメントに存在しない名前は選択状態にしない
   * （「存在しないものが選択されている」状態を作らないため、選択が外れる）。
   * 複数選んでいたときは、この 1 つだけの選択に戻る。
   */
  select(state: EditorState, name: string): EditorState {
    return {
      ...state,
      selection: SelectionState.fromName(
        selectableName(EditorState.document(state), name),
      ),
    };
  },

  /**
   * 選んでいるものがすべて同じ部品のインスタンスであるときの、その部品の名前。
   * 規則は `DocumentSelection.sourceName` が持つ。
   *
   * @param state 選択とドキュメントの出どころ
   * @returns 出どころの部品名。揃っていなければ `none`
   */
  sourceName(state: EditorState): Option<string> {
    return DocumentSelection.sourceName(EditorState.documentSelection(state));
  },

  /**
   * 選択中のインスタンスと同じ部品を指すインスタンスをまとめて選ぶ
   * （UI 案 docs/Design Composer.html の `Select all N instances`）。
   *
   * 集めるのは `DesignDocument.collectInstanceNames` が持ち、ここは対象の部品を
   * 選択から決めて選択へ入れるだけ（`rules/coding.md`「features 層にドメイン知識を
   * 書かない」）。対象を引数で受け取らないのは `detachInstance` と同じ理由で、
   * 導線が「選択中のインスタンスと同じものを選ぶ」しか無いため。
   *
   * 集まるのは artboard 配下だけなので、選択が複数の artboard にまたがりうる。
   * ツリーは 1 枚しか映さないため、映っていない artboard のぶんはキャンバスにだけ
   * 枠が出る（docs/06-ui.md「選択」）。
   *
   * @param state 選択元のエディタの状態
   * @returns まとめて選んだ状態。選んでいるものが同じ部品のインスタンスで揃って
   *   いないとき（未選択・artboard・プリミティブ・参照先が混ざった複数選択）は `none`
   */
  selectAllInstances(state: EditorState): Option<EditorState> {
    return Option.map(EditorState.sourceName(state), (componentName) => ({
      ...state,
      selection: SelectionState.create(
        DesignDocument.collectInstanceNames(
          EditorState.document(state),
          componentName,
        ),
      ),
    }));
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
    return {
      ...state,
      selection: SelectionState.fromName(Option.fromNullable(innermost)),
    };
  },

  clearSelection(state: EditorState): EditorState {
    return { ...state, selection: SelectionState.None };
  },

  /**
   * エラーが指すノードを選ぶ（#136 のエラー行の `Reveal`）。
   *
   * Why not: `select` に繋がない。エラーの飛び先は表示中のドキュメントに無いことがあり
   * （ファイルが不正な間、映っているのは最後に正常だった内容なので、壊れたファイルで
   * 増えたノードは在らない。部品定義の中のノードも `selectableName` の対象外）、
   * `select` は選べない名前で選択を外すため、繋ぐと「押したら選択が消えた」になる。
   *
   * @param state 選択を移す前の状態
   * @param name エラーが指しているノードの名前
   * @returns そのノードを選んだ状態。表示中のドキュメントで選べない名前なら `none`
   */
  reveal(state: EditorState, name: string): Option<EditorState> {
    return Option.map(
      selectableName(EditorState.document(state), name),
      (revealed) => ({
        ...state,
        selection: SelectionState.fromName(Option.some(revealed)),
      }),
    );
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
   * 拒んだときはドキュメントも選択もそのままにし、ファイルの妥当性だけを載せ替える。
   * 正常 / 不正の 2 つの遷移を 1 つのメソッドで受けるのは、呼び出し側が
   * 「ドキュメントを差し替えたのにエラーが残っている」ような組み合わせを作れないようにするため。
   *
   * @param state 取り込む前の状態
   * @param reload 外部変更を取り込んだ結果
   * @param at この取り込みを受け取った時刻（不正になった起点として `FileValidity` が持つ）
   * @returns 取り込めたならドキュメントを差し替えた状態、拒んだなら妥当性だけを載せ替えた状態
   */
  applyReload(
    state: EditorState,
    reload: DocumentReload,
    at: Instant,
  ): EditorState {
    const fileValidity = FileValidity.withReload(
      state.fileValidity,
      reload,
      at,
    );
    switch (reload.kind) {
      case "reloaded":
        return withDocument({ ...state, fileValidity }, reload.document);
      case "rejected":
        return { ...state, fileValidity };
    }
  },

  /**
   * 表示中の内容をファイルへ書き戻した後の状態（#136 の `revert file`）。
   *
   * ファイルの中身が表示中のドキュメントと一致したので、ファイル由来のエラーは無くなる。
   * ドキュメントには触れないので履歴も伸びない（戻した先が今映っているものそのもので、
   * undo で戻る先が増えるような編集は起きていない）。
   *
   * Why not: 書き戻しを `applyReload` の `reloaded` として表さない。`withDocument` を通るため
   * 中身が変わっていないのに履歴が 1 つ伸び、undo が「何も起きない 1 手」を挟むことになる。
   *
   * @param state 書き戻す前の状態
   * @returns ファイル由来のエラーを畳んだ状態
   */
  applyRevert(state: EditorState): EditorState {
    return { ...state, fileValidity: FileValidity.valid };
  },

  /**
   * 1 つ前のドキュメントへ戻す（docs/06-ui.md「編集操作の一覧」の undo / #41）。
   *
   * 戻る先が無ければ「その undo は存在しない」ことなので `none`。
   * ショートカットは履歴が空でも押せるため、画面の操作からこの `none` に到達する。
   * ファイルが不正な間も `none`。現在地が動くとその内容が自動保存へ流れるので、
   * 履歴を戻すことも凍結中は編集と同じ扱いにする。
   * 戻した結果は通常の編集と同じ経路でファイルへ自動保存される
   * （docs/05-architecture.md「保存モデル」）。
   */
  undo(state: EditorState): Option<EditorState> {
    if (EditorState.isFileInvalid(state)) {
      return Option.none;
    }
    return Option.map(EditHistory.undo(state.history), (history) =>
      withHistory(state, history),
    );
  },

  /**
   * undo で戻る前のドキュメントへ進める（docs/06-ui.md「編集操作の一覧」の redo / #41）。
   *
   * 進む先が無ければ `none`。ファイルが不正な間も `none`。
   * 到達しうる理由は `undo` と同じ。
   */
  redo(state: EditorState): Option<EditorState> {
    if (EditorState.isFileInvalid(state)) {
      return Option.none;
    }
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
    return reordered.ok ? withEdit(state, reordered.value) : Option.none;
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
    return moved.ok ? withEdit(state, moved.value) : Option.none;
  },

  /**
   * 選択位置へノードを挿すときの位置（docs/06-ui.md「編集操作の一覧」の挿入は
   * 「選択位置の子として追加」）。
   *
   * 選択が無いとき・選択が子を持てないノード（Text / インスタンス）のときは
   * 挿せる位置が無いので `none`。挿入のボタンはこれが `none` の間は押せなくしているため、
   * 画面の操作から `insertNode` の `none` には到達しない。
   */
  insertPosition(state: EditorState): Option<ChildPosition> {
    return Option.flatMap(EditorState.singleName(state), (name) =>
      DesignDocument.appendPositionOf(EditorState.document(state), name),
    );
  },

  /**
   * 選択中のノードをサブツリーごとクリップボードへ入れる
   * （docs/06-ui.md「編集操作の一覧」のコピー & ペースト）。
   *
   * コピーはサブツリー単位なので対象はノードそのもの。artboard も選択できるが、
   * artboard はノードとして貼れない（貼る先が「選択位置の子」で、artboard は
   * どのノードの子にもなれない）ため `none` にする。
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
        return pasted.ok ? withEdit(state, pasted.value) : Option.none;
      }),
    );
  },

  /**
   * ツリー上の指した位置へノードを挿す（docs/06-ui.md「編集操作の一覧」の挿入）。
   *
   * 名前の採番に要るのはドキュメント全体の名前なので、ノードの組み立ては挿入先を
   * 受け取ってから行う（`NodeTemplate` は名前を持たない）。
   * 位置を引数で受けるのは、パレットからキャンバスへ落とす経路が落とした先へ挿すため
   * （UI 案 docs/Design Composer.html は `Assets` を挿入がドラッグ専用の
   * browse-only とし、ドロップ先をツリー上の位置として示す / #203）。
   * 選択は動かさない（理由は `insertNode` と同じ）。
   *
   * @param state 挿す前のエディタの状態
   * @param template 挿すものの指定
   * @param at 挿す位置
   * @returns 挿したあとの状態。居ない親・範囲外の位置と、ファイルが不正な間は `none`
   */
  insertNodeAt(
    state: EditorState,
    template: NodeTemplate,
    at: ChildPosition,
  ): Option<EditorState> {
    const document = EditorState.document(state);
    const node = NodeTemplate.toNode(
      template,
      DesignDocument.usedNames(document),
    );
    const inserted = DesignDocument.insertNode(document, at, node);
    return inserted.ok ? withEdit(state, inserted.value) : Option.none;
  },

  /**
   * 選択位置の子としてノードを挿す（docs/06-ui.md「編集操作の一覧」の挿入）。
   *
   * 選択は動かさない。続けて挿したときに兄弟が並ぶのが「選択位置の子として追加」の素直な
   * 繰り返しで、挿すたびに選択が内側へ移ると Box を足しただけで入れ子が深くなるため。
   */
  insertNode(state: EditorState, template: NodeTemplate): Option<EditorState> {
    return Option.flatMap(EditorState.insertPosition(state), (at) =>
      EditorState.insertNodeAt(state, template, at),
    );
  },

  /**
   * 選んでいるものを削除する（docs/06-ui.md「編集操作の一覧」の削除と artboard 操作）。
   * ノードならサブツリーごと、artboard ならその 1 枚を配下ごと消す。
   *
   * 対象を引数で受け取らず選択から決めるのは `applyPropEdit` と同じ理由で、
   * 削除の導線が「選択中のものを消す」しか無いため。artboard とノードで入口を
   * 分けないのは、削除の導線がキーボード（Delete / Backspace）1 つしかなく、
   * どちらを消すかは押した時点の選択でしか決まらないため。振り分けそのものは
   * `DesignDocument.remove` が持つ。
   *
   * 消したものは新しいドキュメントに無いので、選択は `withHistory` で外れる。
   * artboard を消したときにツリーが映す 1 枚が先頭へ落ちるのは、選択が外れた結果
   * `DocumentSelection.currentArtboard` が導出し直すため。
   */
  removeSelected(state: EditorState): Option<EditorState> {
    return Option.flatMap(EditorState.singleName(state), (name) => {
      const removed = DesignDocument.remove(EditorState.document(state), name);
      return removed.ok ? withEdit(state, removed.value) : Option.none;
    });
  },

  /**
   * artboard を 1 枚足して、そのまま見られるよう選択する
   * （docs/06-ui.md「編集操作の一覧」の artboard 操作 / UI 案 docs/Design Composer.html の
   * `Artboards` 見出しの右の `+`）。
   *
   * 名前は呼び出し側が決めず、ドキュメントの中で衝突しない名前をここで採る
   * （追加のボタンが渡せるものは無く、名前の一意性はドキュメントを見ないと決まらない）。
   * 足す先は並びの末尾。UI 案が並べ替えの入口を `Artboards` の一覧に置いている以上、
   * どこへ足すかは後から動かせる。
   *
   * 選択まで動かすのは、`DocumentSelection.currentArtboard` が未選択のとき**先頭**へ
   * 落ちるため。選択しないと、末尾に足した 1 枚をツリーが映さない
   * （`addToken` が追加したトークンを編集できるよう選ぶのと同じ扱い）。
   * Why not: 挿入（`insertNode`）に揃えて選択を動かさない案は採らない。ノードは
   * 「選択位置の子」へ挿すので選択が起点だが、artboard は起点を持たないため、
   * 揃えても繰り返しの結果が素直にならない。
   *
   * @param state 足す前のエディタの状態
   * @returns 1 枚増え、それを選んだ状態。ファイルが不正な間は `none`
   *   （`insertArtboard` の失敗は末尾を指す限り起こらないので、そちらでは `none` にならない）
   */
  addArtboard(state: EditorState): Option<EditorState> {
    const document = EditorState.document(state);
    const artboard = Artboard.createInitial(
      DesignDocument.uniqueName(
        Artboard.BaseName,
        DesignDocument.usedNames(document),
      ),
    );
    const added = DesignDocument.insertArtboard(
      document,
      document.artboards.length,
      artboard,
    );
    return added.ok
      ? Option.map(withEdit(state, added.value), (edited) =>
          EditorState.select(edited, artboard.name),
        )
      : Option.none;
  },

  /**
   * artboard の並び順を入れ替える（docs/06-ui.md「編集操作の一覧」の artboard 操作。
   * キャンバスは配列順に自動配置するので、並びがそのまま置かれる順になる）。
   *
   * 動かせない指定（移動先が並びの外）は「その移動が存在しない」ことと同じなので
   * `none` にする。一覧は隣がいない向きのボタンを出さないため、画面の操作から
   * この `none` には到達しない（`reorderNode` と同じ扱い）。
   *
   * 選択は artboard の name で持っており並べ替えでは変わらないため、そのまま引き継ぐ。
   * ただし**何も選んでいないときはツリーが映す 1 枚が入れ替わる**。
   * `DocumentSelection.currentArtboard` が未選択のとき先頭を映す規則によるもので、
   * 並びを変えた結果として意図している。
   *
   * @param state 並べ替える前のエディタの状態
   * @param move 動かす artboard の今の位置と、移す先の位置
   * @returns 並びが変わった状態。並びの外を指すときと、ファイルが不正な間は `none`
   */
  reorderArtboard(state: EditorState, move: IndexMove): Option<EditorState> {
    const reordered = DesignDocument.reorderArtboard(
      EditorState.document(state),
      move.fromIndex,
      move.toIndex,
    );
    return reordered.ok ? withEdit(state, reordered.value) : Option.none;
  },

  /**
   * 選択中のインスタンスを実体の木へ置き換える
   * （UI 案 docs/Design Composer.html の `Detach instance`）。
   *
   * 展開・overrides の焼き込み・内側のノードの改名は `DesignDocument.detach`
   * が持つ。ここは対象を選択から決めて履歴へ積むだけ（`rules/coding.md`
   * 「features 層にドメイン知識を書かない」）。
   *
   * 対象を引数で受け取らないのは `removeSelected` と同じ理由で、解除の導線が
   * 「選択中のインスタンスを解除する」しか無いため。
   *
   * @param state 解除元のエディタの状態
   * @returns 解除後のエディタの状態。インスタンスを選んでいないときと、
   *   参照先が無い・循環している部品を指しているときは `none`
   */
  detachInstance(state: EditorState): Option<EditorState> {
    return Option.flatMap(EditorState.singleName(state), (name) => {
      const detached = DesignDocument.detach(EditorState.document(state), name);
      return detached.ok ? withEdit(state, detached.value) : Option.none;
    });
  },

  /**
   * 選択中のノードを部品として切り出し、元の位置をその部品のインスタンスにする
   * （docs/06-ui.md「部品化・解除」/ UI 案 docs/Design Composer.html の `Create component`）。
   *
   * 切り出しと差し替えは `DesignDocument.createComponent` が持つ。ここは対象を選択から
   * 決めて履歴へ積むだけ（`rules/coding.md`「features 層にドメイン知識を書かない」）。
   *
   * 対象を引数で受け取らないのは `detachInstance` と同じ理由で、部品化の導線が
   * 「選択中のものを部品にする」しか無いため。部品名だけを受け取る。
   *
   * 公開 prop は宣言しない。宣言の追加は AI / JSON 編集の担当で、部品化時には
   * ゼロで作る（docs/06-ui.md「部品化（Create Component）」）。これは
   * `DesignDocument.createComponent` が `Component.fromNode` で作る形そのもの。
   *
   * @param state 部品化元のエディタの状態
   * @param componentName 新しく作る部品に付ける名前
   * @returns 部品化後のエディタの状態。何も選んでいないとき、artboard や
   *   インスタンスを選んでいるとき、名前が識別子の規則を満たさない・既に
   *   使われているときは `none`
   */
  createComponent(
    state: EditorState,
    componentName: string,
  ): Option<EditorState> {
    return Option.flatMap(EditorState.singleName(state), (name) => {
      const created = DesignDocument.createComponent(
        EditorState.document(state),
        name,
        componentName,
      );
      return created.ok ? withEdit(state, created.value) : Option.none;
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
    return Option.flatMap(EditorState.singleName(state), (name) => {
      const edited = DesignDocument.applyPropEdit(
        EditorState.document(state),
        name,
        edit,
      );
      return edited.ok ? withEdit(state, edited.value) : Option.none;
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
    return Option.flatMap(EditorState.singleName(state), (name) => {
      const resized = DesignDocument.resize(
        EditorState.document(state),
        name,
        size,
      );
      return resized.ok ? withEdit(state, resized.value) : Option.none;
    });
  },

  isSelected(state: EditorState, name: string): boolean {
    return DocumentSelection.isSelected(
      EditorState.documentSelection(state),
      name,
    );
  },

  /**
   * 編集するトークンを選ぶ（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
   * ドキュメントに無いトークンは選択状態にしない（`select` と同じ理由で、
   * 「存在しないものが選択されている」状態を作らない）。
   */
  selectToken(state: EditorState, ref: TokenRef): EditorState {
    return {
      ...state,
      selectedToken: selectableToken(EditorState.document(state), ref),
    };
  },

  /**
   * 表示中のドキュメントと、その中で選ばれているトークンの対
   * （`TokenSelection`。トークン編集の画面はこれだけで描ける）。
   *
   * 参照元・破線の相手・選択中かの判定はこの対に属するので、`EditorState` は
   * 対を渡すところまでを持つ（#250）。
   *
   * @param state ドキュメントと選択の出どころ
   * @returns 表示中のドキュメントと選択中のトークンの対
   */
  tokenSelection(state: EditorState): TokenSelection {
    return TokenSelection.create(
      EditorState.document(state),
      state.selectedToken,
    );
  },

  /** 選択中のトークン。ドキュメントから引き直すので、値は常に現在のもの。 */
  selectedToken(state: EditorState): Option<Token> {
    return TokenSelection.token(EditorState.tokenSelection(state));
  },

  /**
   * トークンを追加し、そのまま編集できるよう選択する。
   *
   * 名前は呼び出し側が決めず、種別の中で衝突しない名前をここで採る。
   * 追加のボタンが渡せるのは「どの種別に足すか」だけで、名前の一意性は
   * ドキュメントを見ないと決まらないため（挿入時の採番と同じ扱い）。
   * 追加できない指定（規則を満たさない基底名）は「その追加が存在しない」ことなので `none`。
   */
  addToken(state: EditorState, template: TokenTemplate): Option<EditorState> {
    const document = EditorState.document(state);
    const token = TokenTemplate.toToken(
      template,
      new Set(TokenSet.names(document.tokens, template.kind)),
    );
    const added = DesignDocument.addToken(document, token);
    return added.ok
      ? Option.map(withEdit(state, added.value), (edited) =>
          EditorState.selectToken(edited, Token.ref(token)),
        )
      : Option.none;
  },

  /**
   * 選択中のトークンの値を差し替える。
   *
   * 対象を引数で受け取らず選択から決めるのは `applyPropEdit` と同じ理由で、
   * トークンの編集欄が出るのが選択中のトークンだけだから。
   * 値だけを受け取り名前は選択から取るので、「選択していないトークンを編集する」
   * 状態を呼び出し側が作れない。
   */
  setTokenValue(state: EditorState, value: TokenValue): Option<EditorState> {
    return Option.flatMap(EditorState.selectedToken(state), (token) => {
      const replaced = DesignDocument.replaceToken(
        EditorState.document(state),
        TokenValue.toToken(value, token.name),
      );
      return replaced.ok ? withEdit(state, replaced.value) : Option.none;
    });
  },

  /**
   * 選択中のトークンの名前を変える。
   *
   * 選択は新しい名前へ移す。`withEdit` は消えた名前の選択を落とすので、
   * そのままだと改名のたびに編集欄が閉じてしまうため。
   * 名前が規則を満たさない・種別の中で重複するときは `none`（画面は前の名前のまま）。
   */
  renameToken(state: EditorState, newName: string): Option<EditorState> {
    return Option.flatMap(state.selectedToken, (ref) => {
      const renamed = DesignDocument.renameToken(
        EditorState.document(state),
        ref,
        newName,
      );
      if (!renamed.ok) {
        return Option.none;
      }
      return Option.map(withEdit(state, renamed.value), (edited) =>
        EditorState.selectToken(edited, { kind: ref.kind, name: newName }),
      );
    });
  },

  /**
   * 選択中のトークンを削除する（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
   *
   * 使用中でも消せる。残った参照は dangling 参照として通常のバリデーションエラーに
   * なるので、削除の側で特別扱いしない（docs/04-tokens.md「スキーマデフォルトとの関係」）。
   * 消したトークンは新しいドキュメントに無いので、選択は `withHistory` で外れる。
   */
  removeToken(state: EditorState): Option<EditorState> {
    return Option.flatMap(state.selectedToken, (ref) => {
      const removed = DesignDocument.removeToken(
        EditorState.document(state),
        ref,
      );
      return removed.ok ? withEdit(state, removed.value) : Option.none;
    });
  },
} as const;

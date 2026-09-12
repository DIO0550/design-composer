import { Artboard } from "@/domains/dcmp/artboard";
import type { AxisLength } from "@/domains/dcmp/axis-length";
import { ChildPlacement } from "@/domains/dcmp/child-placement";
import { ChildPosition } from "@/domains/dcmp/child-position";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { Node, PropEdit } from "@/domains/dcmp/node";
import { Placement } from "@/domains/dcmp/placement";
import {
  Token,
  type TokenRef,
  TokenSet,
  TokenValue,
} from "@/domains/dcmp/token";
import { DocumentError } from "@/domains/session/document-error";
import type { DocumentReload } from "@/domains/session/document-reload";
import { DocumentSelection } from "@/domains/session/document-selection";
import { FileValidity } from "@/domains/session/file-validity";
import { NodeTemplate } from "@/domains/session/node-template";
import { SelectionDig } from "@/domains/session/selection-dig";
import { SelectionState } from "@/domains/session/selection-state";
import { TokenSelection } from "@/domains/session/token-selection";
import type { Instant } from "@/domains/unit/instant";
import type { Offset } from "@/domains/unit/offset";
import { EditHistory } from "@/features/editor/domains/edit-history";
import { ReorderStep } from "@/features/editor/domains/reorder-step";
import { TokenTemplate } from "@/features/editor/domains/token-template";
import type { IndexMove } from "@/types/IndexMove";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * エディタ画面が保持する状態（docs/06-ui.md「画面構成」「選択」）。選択はドキュメントの
 * 中の名前でしか意味を持たないため同じ器に持ち、`copiedNode`（アプリ内クリップボード）と
 * `isRenaming`（名前を編集中か）も同じく非永続なのでここに置く。
 *
 * ドキュメント自身の不正は持たず `EditorState.documentErrors` で導出する。
 *
 * 現在地は常に「最後に正常だったドキュメント」で、外部変更を拒んでも差し替えない。
 * `fileValidity` が `invalid` の間は編集を受け付けない（古い表示から作った内容を書き出すと、
 * より新しい外部の書き込みを潰すため）。
 */
export type EditorState = Readonly<{
  history: EditHistory;
  selection: SelectionState;
  selectedToken: Option<TokenRef>;
  copiedNode: Option<Node>;
  /**
   * 選んでいるものの名前を編集中か（docs/06-ui.md「名前の変更」）。
   *
   * 対象そのものは持たない。持つと `selection` と食い違った対象を編集できてしまうので、
   * 対象は `EditorState.renamingName` が選択から引く。
   */
  isRenaming: boolean;
  fileValidity: FileValidity;
}>;

/**
 * 選択中のトークン。ドキュメントから消えていれば選択は無い。
 *
 * `selection` と同時に立っていてよい。左ペインのタブ（Layers / Tokens）がどちらを右ペイ
 * ンに映すかを決めるので、2 つは「それぞれのタブの中の選択」であって矛盾しない（UI 案
 * docs/Design Composer.html の tokens 状態）。
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
  return Option.or(
    selectableNodeName(document, name),
    selectableArtboardName(document, name),
  );
}

/**
 * 選択できる名前のうち、artboard の配下のノードにあたるもの。
 *
 * 「選択できるのは何か」の定義を 1 箇所に保ったまま、その半分だけを使えるようにしている。
 *
 * @param document 選択先を引くドキュメント
 * @param name 選択されている名前
 * @returns 配下のノードとして残っていれば `some`、無ければ `none`
 */
function selectableNodeName(
  document: DesignDocument,
  name: string,
): Option<string> {
  return DesignDocument.findNode(document, name).some
    ? Option.some(name)
    : Option.none;
}

/**
 * 並びのうち、選択できるノードとして残っている名前だけ。
 *
 * キャンバスから届く名前は、押された位置から辿ったもの（`selectAt`）と範囲に重なった
 * もの（`selectNodes`）の 2 通りあり、どちらも同じ絞り込みを通す。**綴りを揃えるだけでは
 * 定義が 2 箇所に散る**ので、絞り込み自体をここへ 1 つ置く。
 *
 * @param document 選択先を引くドキュメント
 * @param names 絞り込む名前の並び
 * @returns 選択できるものだけを、渡された順のまま残した並び
 */
function selectableNodeNames(
  document: DesignDocument,
  names: readonly string[],
): readonly string[] {
  return names.filter((name) => selectableNodeName(document, name).some);
}

/**
 * 選択できる名前のうち、artboard 自身にあたるもの。
 *
 * @param document 選択先を引くドキュメント
 * @param name 選択されている名前
 * @returns artboard として残っていれば `some`、無ければ `none`
 */
function selectableArtboardName(
  document: DesignDocument,
  name: string,
): Option<string> {
  return DesignDocument.findArtboard(document, name).some
    ? Option.some(name)
    : Option.none;
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
 * 選択は name によるベストエフォートで引き継ぎ、新しい現在地に無くなっていれば外す。編
 * 集・undo・外部変更の取り込みで共通の扱いなので、「存在しないものが選択されている」状
 * 態をここ 1 箇所で潰す（複数選択も残った名前だけで作り直す / docs/06-ui.md「選択」）。
 *
 * 名前の編集は、対象が残っているかに依らず閉じる。ドキュメントが変わった時点で打ちかけの
 * 下書きは古い名前を元にしているため。
 *
 * クリップボードは引き継ぐ。
 *
 * @param state 反映元のエディタの状態
 * @param history 新しい現在地を持つ履歴
 * @returns 履歴が差し替わり、消えた選択が外れ、名前の編集が閉じたエディタの状態
 */
function withHistory(state: EditorState, history: EditHistory): EditorState {
  return {
    ...state,
    history,
    isRenaming: false,
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
 * 取り込みを `withEdit` に通すと、渡す時点で妥当性を `valid` へ差し替えてあるために必ず
 * `some` になり、呼び出し側に永久に届かない `none` の分岐が増える。
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
 * ファイルが不正な間は編集そのものが存在しないので `none`。映っているのは最後に正常だっ
 * た表示で、そこへ加えた編集を書き出すと外部の書き込みを上書きしてしまうため（UI 案
 * docs/Design Composer.html の Error 画面が `freezes rail / panels / toolbar`）。
 *
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
   * クリップボードと名前の編集も同じく実行時のみの状態なので、空 / 編集していないで始まる。
   */
  create(document: DesignDocument): EditorState {
    return {
      history: EditHistory.create(document),
      selection: SelectionState.None,
      selectedToken: Option.none,
      copiedNode: Option.none,
      isRenaming: false,
      fileValidity: FileValidity.valid,
    };
  },

  /** 画面に映っているドキュメント（履歴の現在地）。 */
  document(state: EditorState): DesignDocument {
    return state.history.present;
  },

  /**
   * 映っているドキュメントと、その中で選ばれているものの対（`DocumentSelection`。左ペイ
   * ンはこれだけで描ける）。
   *
   * 選択から決まる読み（`isSelected` / `names` / `singleName` / `sourceName` /
   * `isCurrentArtboard` / `singleSelection`）はすべてこの対が持つ。`EditorState` に委譲を
   * 置くのは、状態しか持っていない消費側が要る 3 つだけ。
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
   * 単一選択を前提とする操作（削除・コピー・prop 編集・リサイズ・部品化・解除・テキスト
   * 編集）はすべてこれを通す。複数選択で `none` になるので、「複数選んでいる間は単一前提
   * の操作が成立しない」（docs/06-ui.md「選択」）が消費側ごとの分岐ではなくここで決まる。
   *
   * @param state 選択の出どころになるエディタの状態
   * @returns 単一選択ならその名前。未選択と複数選択では `none`
   */
  singleName(state: EditorState): Option<string> {
    return DocumentSelection.singleName(EditorState.documentSelection(state));
  },

  /**
   * 今その名前を編集している対象（docs/06-ui.md「名前の変更」）。
   *
   * 編集中かどうかだけを状態に持ち、対象は選択から引く。表示する側と書き換える側で対象
   * の出どころが割れないようにするため。
   *
   * @param state 編集中かと選択の出どころになるエディタの状態
   * @returns 名前を編集中なら、その対象の名前。編集していなければ `none`
   */
  renamingName(state: EditorState): Option<string> {
    return state.isRenaming ? EditorState.singleName(state) : Option.none;
  },

  /**
   * 選んでいるものの名前の編集を始める（docs/06-ui.md「名前の変更」）。
   *
   * @param state 選択の出どころになるエディタの状態
   * @returns 編集を始めた状態。1 つも選んでいない・複数選んでいる・ファイルが不正な間は
   *   `none`
   */
  startRenaming(state: EditorState): Option<EditorState> {
    if (EditorState.isFileInvalid(state)) {
      return Option.none;
    }
    return Option.map(EditorState.singleName(state), () => ({
      ...state,
      isRenaming: true,
    }));
  },

  /**
   * 名前で指したものを選んでから、その名前の編集を始める（ツリーと artboard 一覧の行の
   * ダブルクリック）。
   *
   * @param state 選び直す元のエディタの状態
   * @param name 編集を始めたい artboard / ノードの名前
   * @returns それを選んで編集を始めた状態。選べない名前と、ファイルが不正な間は `none`
   */
  startRenamingAt(state: EditorState, name: string): Option<EditorState> {
    return EditorState.startRenaming(EditorState.select(state, name));
  },

  /** 名前の編集をやめる。名前は変わらない。 */
  cancelRenaming(state: EditorState): EditorState {
    return { ...state, isRenaming: false };
  },

  /**
   * 名前の編集を終える。使える名前なら確定し、使えなければ取り消す
   * （docs/06-ui.md「名前の変更」のフォーカス外し）。
   *
   * @param state 編集中の対象を持つ状態
   * @param newName 付けたい名前
   * @returns 名前が変わった状態。使えない名前なら、名前は変わらず編集だけ閉じた状態
   */
  finishRenaming(state: EditorState, newName: string): EditorState {
    return Option.unwrapOr(
      EditorState.renameSelected(state, newName),
      EditorState.cancelRenaming(state),
    );
  },

  /**
   * 編集中の名前を新しい名前にする（docs/06-ui.md「名前の変更」）。
   *
   * 選択は新しい名前へ移り、編集は閉じる。使えない名前（識別子の規則を満たさない・単一
   * 名前空間で重複する）では `none` を返し、画面は前の名前のまま編集も閉じない。
   *
   * @param state 編集中の対象と、書き換える先のドキュメントを持つ状態
   * @param newName 付けたい名前
   * @returns 名前が変わり編集が閉じた状態。名前を編集していない・使えない名前・ファイル
   *   が不正な間は `none`
   */
  renameSelected(state: EditorState, newName: string): Option<EditorState> {
    return Option.flatMap(EditorState.renamingName(state), (from) => {
      const renamed = DesignDocument.rename(EditorState.document(state), {
        from,
        to: newName,
      });
      if (!renamed.ok) {
        return Option.none;
      }
      return Option.map(withEdit(state, renamed.value), (edited) =>
        EditorState.select(edited, newName),
      );
    });
  },

  /**
   * 画面に映っているドキュメント自身の不正。使用中トークンの削除で作った dangling 参照も、開
   * いた時点で既にファイルに載っていた不正も、ここに出る。
   */
  documentErrors(state: EditorState): readonly DocumentError[] {
    return DocumentError.collectFrom(EditorState.document(state));
  },

  /**
   * ファイルが不正なまま残っているか（docs/03-schema.md「不正ファイル時の挙動」）。真の
   * あいだ、画面に映っているのはファイルの現在の中身ではなく最後に正常だったドキュメン
   * ト。
   *
   * 表示を凍結する側（キャンバスのスクリム・両ペインの淡色・上部バーのエラー表示）と、編集を
   * 止める側（`withEdit` / `undo` / `redo`）と自動保存が同じ妥当性を見る。凍結するかだけを尋
   * ねる側が `fileValidity` の直和を開かずに済むよう、判定はここに置く。
   *
   * @param state ファイルの妥当性の出どころになるエディタの状態
   * @returns 外部変更を拒んだままなら `true`
   */
  isFileInvalid(state: EditorState): boolean {
    return FileValidity.isInvalid(state.fileValidity);
  },

  /**
   * 選択を切り替える。複数選んでいたときは、この 1 つだけの選択に戻る。
   *
   * ドキュメントに存在しない名前では選択が外れる。
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
   * 選択中のインスタンスと同じ部品を指すインスタンスをまとめて選ぶ（UI 案 docs/Design
   * Composer.html の `Select all N instances`）。
   *
   * 集めるのは `DesignDocument.collectInstanceNames` が持ち、ここは対象の部品を選択から決め
   * て選択へ入れるだけ。
   *
   * 集まるのは artboard 配下だけなので選択が複数の artboard にまたがりうる。ツリーは 1
   * 枚しか映さないため、映っていない artboard のぶんはキャンバスにだけ枠が出る（docs/06-ui.md
   * 「選択」）。
   *
   * @param state 選択元のエディタの状態
   * @returns まとめて選んだ状態。選んでいるものが同じ部品のインスタンスで揃って
   *   いないとき（未選択・artboard・プリミティブ・参照先が混ざった複数選択）は
   *   `none`
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
   * キャンバスで押された位置から、掘る量ぶんだけ内側へ入ったものを選ぶ（docs/06-ui.md「選
   * 択」）。
   *
   * ここが持つのは候補の絞り込みだけで、どれを選ぶかの規則は `SelectionDig` にある。キャ
   * ンバスは部品インスタンスの中身まで描くが、そこに出るのは部品定義側のノード名でドキュ
   * メントの木には無いため候補に入らない（掘ってもインスタンス自身で止まる）。
   *
   * どれも選べなければ選択は外れる。
   *
   * @param state 選択を移す前の状態
   * @param names 押された位置から外へ辿った名前（内→外）
   * @param dig 押し方から決まった掘る量
   * @returns 掘った先を選んだ状態。選べる名前が 1 つも無ければ未選択
   */
  selectAt(
    state: EditorState,
    names: readonly string[],
    dig: SelectionDig,
  ): EditorState {
    const document = EditorState.document(state);
    const nodeCandidates = selectableNodeNames(document, names);
    const artboardCandidate = ArrayEx.first(
      names.filter((name) => selectableArtboardName(document, name).some),
    );
    const dug = SelectionDig.nameAt(
      dig,
      nodeCandidates,
      EditorState.singleName(state),
    );
    return {
      ...state,
      selection: SelectionState.fromName(Option.or(dug, artboardCandidate)),
    };
  },

  /**
   * 名前で指したものをまとめて選ぶ（キャンバスの範囲選択 / docs/06-ui.md「範囲選択」）。
   *
   * 選べないもの（ドキュメントに無い名前・部品定義の中の参照ノード）は落とす。絞り込みは
   * `selectAt` と同じ `selectableNodeNames` を通す（選べるものの定義を 1 箇所に保つ）。
   *
   * `selectAllInstances` へは寄せていない。あちらは**対象を状態から決める**
   * （選択中のインスタンスと同じ部品）のに対し、こちらは引数で受ける。共通なのは
   * `SelectionState.create` の 1 行だけで、そこは既に共有されている。
   *
   * @param state 選択を移す前の状態
   * @param names 選びたいものの名前
   * @returns 選べるものだけを選んだ状態。1 つも選べなければ未選択
   *   （`SelectionState.create` が空を未選択へ落とす）
   */
  selectNodes(state: EditorState, names: readonly string[]): EditorState {
    return {
      ...state,
      selection: SelectionState.create(
        selectableNodeNames(EditorState.document(state), names),
      ),
    };
  },

  clearSelection(state: EditorState): EditorState {
    return { ...state, selection: SelectionState.None };
  },

  /**
   * エラーが指すノードを選ぶ（エラー行の `Reveal`）。
   *
   * エラーの飛び先は表示中のドキュメントに無いことがあり（不正な間は最後に正常だった内容が映
   * り、部品定義の中のノードも `selectableName` の対象外）、繋ぐと「押したら選択が消えた」に
   * なる。
   *
   * @param state 選択を移す前の状態
   * @param name エラーが指しているノードの名前
   * @returns そのノードを選んだ状態。表示中のドキュメントで選べない名前なら
   *   `none`
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
   * 取り込めたときは無条件にドキュメントを差し替える（自動保存により GUI 側に未保存の変
   * 更は無い）。
   *
   * 取り込みは履歴を捨てずに 1 つの編集として積む。外部の書き込みが GUI 側の変更を上書
   * きしたとき、undo で直前のドキュメントへ戻せることが「GUI 側の失われた変更は undo バ
   * ッファから復元できる」の中身だから（docs/05-architecture.md「競合の解決」）。
   *
   * 拒んだときはドキュメントも選択もそのままにし、ファイルの妥当性だけを載せ替える。
   *
   * @param state 取り込む前の状態
   * @param reload 外部変更を取り込んだ結果
   * @param at この取り込みを受け取った時刻（不正になった起点として
   *   `FileValidity` が持つ）
   * @returns 取り込めたならドキュメントを差し替えた状態、拒んだなら妥当性だけを
   *   載せ替えた状態
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
   * 表示中の内容をファイルへ書き戻した後の状態（`revert file`）。ファイルの中身
   * が表示中のドキュメントと一致したので、ファイル由来のエラーは無くなる。
   *
   * ドキュメントには触れないので履歴も伸びない。
   *
   * @param state 書き戻す前の状態
   * @returns ファイル由来のエラーを畳んだ状態
   */
  applyRevert(state: EditorState): EditorState {
    return { ...state, fileValidity: FileValidity.valid };
  },

  /**
   * 1 つ前のドキュメントへ戻す（docs/06-ui.md「編集操作の一覧」の undo）。戻した結果は通常の
   * 編集と同じ経路でファイルへ自動保存される。
   *
   * 戻る先が無ければ「その undo は存在しない」ことなので `none`（ショートカットは履歴が
   * 空でも押せるため、画面の操作からここに到達する）。ファイルが不正な間も `none` で、現
   * 在地が動くとその内容が自動保存へ流れるため、履歴を戻すことも凍結中は編集と同じ扱い。
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
   * undo で戻る前のドキュメントへ進める（docs/06-ui.md「編集操作の一覧」の redo）。
   *
   * 進む先が無ければ `none`。ファイルが不正な間も `none`。
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
   * 動かせない指定（親が無い・移動先が並びの外）は「その移動が存在しない」ことなので
   * `none`。ツリービューは隣がいない向きの移動ボタンを出さないが、**キーボードの割り当て
   * は端でも押せる**ため、画面の操作からこの `none` に到達する（`reorderSelectedNode`）。
   *
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
   * 選択中のノードを、兄弟の並びの中で 1 つぶん動かす
   * （docs/06-ui.md「編集操作の一覧」の並べ替え）。
   *
   * ツリーのドラッグは掴んだ位置を持っているので `reorderNode` を直に呼ぶ。
   *
   * @param state 動かす前の編集状態
   * @param step 動かす向き
   * @returns 動かしたあとの編集状態。1 つだけ選んでいないとき（未選択・複数選択）、
   *   選んでいるものが並びに載っていないとき（artboard 自身）、その向きに隣がいないときは `none`
   */
  reorderSelectedNode(
    state: EditorState,
    step: ReorderStep,
  ): Option<EditorState> {
    const from = Option.flatMap(EditorState.singleName(state), (name) =>
      DesignDocument.findChildPosition(EditorState.document(state), name),
    );
    return Option.flatMap(from, (position) =>
      EditorState.reorderNode(
        state,
        position,
        ReorderStep.toIndex(step, position),
      ),
    );
  },

  /**
   * ノードを別の位置へ移す（docs/06-ui.md「キャンバス直接操作」の移動）。`to` はキャン
   * バスが提示したドロップ先、つまり**移動前の並びを見て決めた**「どの Box の何番目の子
   * として置くか」（実際に挿す位置への読み替えは `ChildPosition.afterRemoving` が持つ）。
   *
   * 動かせない指定（自分の子孫の下・親が居ない・範囲外）と、今いる位置を持たないもの（ド
   * キュメントに無い名前・artboard 自身）は「その移動が存在しない」ことなので `none`。キ
   * ャンバスは受け入れられない先をハイライトしないため、画面の操作からは到達しない。
   *
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
   * 絶対配置のノードを、指した親の中の座標へ置き直す（docs/06-ui.md「キャンバス直接操作」
   * の移動のうち、座標が動く側）。指した親が今の親と違えばそこへ付け替わるが、木と座標の
   * 書き換えを `DesignDocument.reposition` が 1 つにするので undo は 1 回で戻る。
   *
   * 座標を持たないもの（ドキュメントに無い名前・artboard 自身）と、子を受け入れられない
   * 親を指した指定は「その編集が存在しない」ことなので `none`。キャンバスは受け入れられ
   * る落とし先だけを見て落とし方を決めるため、画面の操作からは到達しない。
   *
   * @param state 置き直す前の編集状態
   * @param name 置き直すノードの名前
   * @param to 置き直したあとの親と、その親から見た座標
   * @returns 置き直したあとの編集状態。座標を持たない相手・受け入れられない親な
   *   ら `none`
   */
  reposition(
    state: EditorState,
    name: string,
    to: ChildPlacement,
  ): Option<EditorState> {
    const repositioned = DesignDocument.reposition(
      EditorState.document(state),
      name,
      to,
    );
    return repositioned.ok ? withEdit(state, repositioned.value) : Option.none;
  },

  /**
   * 選択中の絶対配置のノードを、今の座標からずらす
   * （docs/06-ui.md「キャンバス直接操作」の移動のうち、座標が動く側）。
   *
   * 親は変えない（ずらした先が別の親に重なっても付け替えない）。付け替えが起きるのは落とし先
   * の親が一緒に届くドラッグだけで、キーからは落とし先が決まらない。
   *
   * @param state ずらす前の編集状態
   * @param delta 動かす量。ドキュメント上の px
   * @returns ずらしたあとの編集状態。1 つだけ選んでいないとき（未選択・複数選択）と、
   *   選んでいるものが座標を持たないとき（フロー配置・インスタンス・artboard 自身）は `none`
   */
  repositionSelectedNodeBy(
    state: EditorState,
    delta: Offset,
  ): Option<EditorState> {
    const document = EditorState.document(state);
    return Option.flatMap(EditorState.singleName(state), (name) =>
      Option.flatMap(
        DesignDocument.childPlacementOf(document, name),
        (current) =>
          EditorState.reposition(
            state,
            name,
            ChildPlacement.create(
              current.parentName,
              Placement.moveBy(current.placement, delta),
            ),
          ),
      ),
    );
  },

  /**
   * artboard をキャンバス上の別の位置へ置き直す（docs/06-ui.md「キャンバス直接操作」）。
   *
   * 相手が artboard でない（ノードの名前 / 無い名前）ときは、その置き直しが存在しない
   * ことと同じなので `none`。履歴も dirty も動かない。キャンバスは掴んだものが
   * artboard のときだけこの操作を送るため、画面の操作からこの `none` には到達しない。
   *
   * @param state 置き直す前の編集状態
   * @param name 置き直す artboard の名前
   * @param canvasPosition 置き直したあとの位置
   * @returns 置き直したあとの編集状態。相手が artboard でなければ `none`
   */
  repositionArtboard(
    state: EditorState,
    name: string,
    canvasPosition: Offset,
  ): Option<EditorState> {
    const repositioned = DesignDocument.repositionArtboard(
      EditorState.document(state),
      name,
      canvasPosition,
    );
    return repositioned.ok ? withEdit(state, repositioned.value) : Option.none;
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
   * 選択中のノードをサブツリーごとクリップボードへ入れる（docs/06-ui.md「編集操作の一覧」
   * のコピー & ペースト）。
   *
   * artboard も選択できるが、貼る先が「選択位置の子」で artboard はどのノードの子にもな
   * れないため `none` にする。入れるのは切り離された複製なので、この後に元のノードを消
   * しても貼れる（ドキュメントは変わらない）。
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
   * 名前の付け替えは `DesignDocument.insertNodeCopy` が挿入と一体で行うため、ここでは順
   * 序を組み立てない。
   *
   * 選択は動かさない。
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
   * 名前の採番に要るのはドキュメント全体の名前なので、ノードの組み立ては挿入先を受け取ってか
   * ら行う（`NodeTemplate` は名前を持たない）。
   *
   * @param state 挿す前のエディタの状態
   * @param template 挿すものの指定
   * @param at 挿す位置
   * @returns 挿したあとの状態。居ない親・範囲外の位置と、ファイルが不正な間は
   *   `none`
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
   * 選択は動かさない。
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
   * 消したものは新しいドキュメントに無いので、選択は `withHistory` で外れる。
   */
  removeSelected(state: EditorState): Option<EditorState> {
    return Option.flatMap(EditorState.singleName(state), (name) => {
      const removed = DesignDocument.remove(EditorState.document(state), name);
      return removed.ok ? withEdit(state, removed.value) : Option.none;
    });
  },

  /**
   * artboard を 1 枚足して、そのまま見られるよう選択する（docs/06-ui.md「編集操作の一覧」
   * の artboard 操作 / UI 案 docs/Design Composer.html の `Artboards` 見出しの右の `+`）。
   *
   * 名前は呼び出し側が決めず、ドキュメントの中で衝突しない名前をここで採る（名前の一意
   * 性はドキュメントを見ないと決まらない）。足す先は並びの末尾で、UI 案が並べ替えの入口
   * を `Artboards` の一覧に置いている以上、どこへ足すかは後から動かせる。
   *
   * @param state 足す前のエディタの状態
   * @returns 1 枚増え、それを選んだ状態。ファイルが不正な間は `none` （`insertArtboard`
   *   の失敗は末尾を指す限り起こらないので、そちらでは `none` にならない）
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
   * artboard の並び順を入れ替える（docs/06-ui.md「編集操作の一覧」の artboard 操作）。
   *
   * キャンバス上で動くのは**座標を持たない artboard だけ**（配列順に自動配置されるため）。
   * 座標を持つ artboard は書かれた位置に置かれるので、変わるのは一覧とツリーの並びになる。
   *
   * 動かせない指定（移動先が並びの外）は `none` で、一覧は隣がいない向きのボタンを出さな
   * いため画面の操作からは到達しない。選択は name で持つので変わらないが、**何も選んでい
   * ないときはツリーが映す 1 枚が入れ替わる**（先頭を映す規則によるもので、意図している）。
   *
   * @param state 並べ替える前のエディタの状態
   * @param move 動かす artboard の今の位置と、移す先の位置
   * @returns 並びが変わった状態。並びの外を指すときと、ファイルが不正な間は
   *   `none`
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
   * 選択中のインスタンスを実体の木へ置き換える（UI 案 docs/Design Composer.html の
   * `Detach instance`）。
   *
   * 展開・overrides の焼き込み・内側のノードの改名は `DesignDocument.detach` が持ち、ここは
   * 対象を選択から決めて履歴へ積むだけ。
   *
   * @param state 解除元のエディタの状態
   * @returns 解除後のエディタの状態。インスタンスを選んでいないときと、参照先
   *   が無い・循環している部品を指しているときは `none`
   */
  detachInstance(state: EditorState): Option<EditorState> {
    return Option.flatMap(EditorState.singleName(state), (name) => {
      const detached = DesignDocument.detach(EditorState.document(state), name);
      return detached.ok ? withEdit(state, detached.value) : Option.none;
    });
  },

  /**
   * 選択中のノードを部品として切り出し、元の位置をその部品のインスタンスにする（docs/06-ui.md
   * 「部品化・解除」/ UI 案 docs/Design Composer.html の `Create component`）。
   *
   * 切り出しと差し替えは `DesignDocument.createComponent` が持ち、ここは対象を選択から決めて
   * 履歴へ積むだけ。
   *
   * 公開 prop は宣言しない。宣言の追加は AI / JSON 編集の担当で、部品化時にはゼロで作る
   * （docs/06-ui.md「部品化（Create Component）」）。
   *
   * @param state 部品化元のエディタの状態
   * @param componentName 新しく作る部品に付ける名前
   * @returns 部品化後のエディタの状態。何も選んでいないとき、artboard やイン
   *   スタンスを選んでいるとき、名前が識別子の規則を満たさない・既に使われてい
   *   るときは `none`
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
   * 選択中の artboard / ノードの大きさを変える（docs/06-ui.md「キャンバス直接操作」のリ
   * サイズハンドル）。
   *
   * 選択が無い・大きさを持たない指定は「そのリサイズが存在しない」ことなので `none`（選択は
   * name で持つのでリサイズでは変わらない）。
   *
   * **まとめて受けることで 1 回の編集になる**（軸ごとに呼ぶと Undo 1 回で片方しか戻らない）。
   * ドラッグ全体が Undo 1 回で戻るわけではない（ポインタが動くたびに 1 件積む）。
   */
  resize(
    state: EditorState,
    sizes: readonly AxisLength[],
  ): Option<EditorState> {
    return Option.flatMap(EditorState.singleName(state), (name) => {
      const resized = DesignDocument.resize(
        EditorState.document(state),
        name,
        sizes,
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
   * 参照元・破線の相手・選択中かの判定はこの対に属するので、`EditorState` は対を渡すところま
   * でを持つ。
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
   * 名前は呼び出し側が決めず、種別の中で衝突しない名前をここで採る（追加のボタンが渡せる
   * のは「どの種別に足すか」だけで、名前の一意性はドキュメントを見ないと決まらない）。
   * 追加できない指定（規則を満たさない基底名）は `none`。
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
   * 値だけを受け取るので、「選択していないトークンを編集する」状態を呼び出し側が作れない。
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
   * 選択は新しい名前へ移す。名前が規則を満たさない・種別の中で重複するときは `none`（画面は
   * 前の名前のまま）。
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

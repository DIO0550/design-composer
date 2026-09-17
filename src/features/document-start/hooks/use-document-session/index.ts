import { useEffect, useEffectEvent, useReducer, useState } from "react";
import { OpenedDocument } from "@/domains/session/opened-document";
import {
  type DocumentOpenFailure,
  DocumentSession,
  type OpenOutcome,
} from "@/features/document-start/domains/document-session";
import { RecentFiles } from "@/features/document-start/domains/recent-files";
import type { AppMenu, AppMenuCommand } from "@/libs/app-menu";
import type { AppStateIpc } from "@/libs/app-state-ipc";
import { AppStateJson } from "@/libs/app-state-json";
import type { DocumentDialog } from "@/libs/document-dialog";
import { type DocumentIpc, toDocumentAccessFailure } from "@/libs/document-ipc";
import { DocumentJson } from "@/libs/document-json";
import type { FileDrop } from "@/libs/file-drop";
import type { Unsubscribe } from "@/libs/tauri-ipc";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * どのドキュメントを開くかが決まるまでに要る、外部世界の口。
 *
 * ダイアログとファイルの読み書きは開く操作の中身、メニューとドロップは操作の起こり方、
 * アプリ自身の状態は操作を待たずに開く相手（前回開いていたファイル）の出どころ。
 * どれが欠けても開く経路のどれかが成立しないので、常に対で必要になる。
 */
export type DocumentSessionPorts = Readonly<{
  ipc: DocumentIpc;
  dialog: DocumentDialog;
  menu: AppMenu;
  drop: FileDrop;
  appState: AppStateIpc;
}>;

/**
 * 開く指示が届く経路。
 *
 * 受け取れなかったときに、どちらが使えないのかを画面へ出すために名前で持つ
 * （1 つに畳むと、生きている側まで壊れていると読める文言になる）。
 */
export const CommandSources = {
  Menu: "menu",
  Drop: "drop",
} as const;

/** 開く指示が届く経路。 */
export type CommandSource = ValueOf<typeof CommandSources>;

/** その経路から指示を受け取れなかったことと、診断用の原文。 */
export type CommandSourceFailure = Readonly<{
  source: CommandSource;
  message: string;
}>;

/** 開く / 新規作成を始める手続き。 */
export type DocumentSessionActions = Readonly<{
  /** ダイアログで選ばせて開く。 */
  openDocument: () => void;
  /** ダイアログで保存先を選ばせて、雛形から作る。 */
  createDocument: () => void;
  /** パスが既に決まっているものを開く（ドロップ・最近使ったファイル）。 */
  openDocumentsAt: (paths: readonly string[]) => void;
}>;

/**
 * 開いているドキュメントを行き来する手続き。
 *
 * 開く / 新規作成と分けて返すのは、開始画面が受け取るのが前者だけだから
 * （rules/components.md「props は必要最小限に絞る」）。
 */
export type DocumentTabActions = Readonly<{
  /** そのパスのドキュメントを見ている状態にする。 */
  activate: (path: string) => void;
  /** そのパスのドキュメントを閉じる。 */
  close: (path: string) => void;
}>;

/** 開いているドキュメントと、最近開いたファイルの一覧。 */
type DocumentSessionState = Readonly<{
  session: DocumentSession;
  recents: RecentFiles;
  /** 保存されている一覧を読み取れなかった理由（診断用の原文）。読めていれば `none`。 */
  recentFilesFailure: Option<string>;
}>;

/** 状態を動かす指示。 */
type DocumentSessionAction =
  | Readonly<{ type: "opening" }>
  | Readonly<{
      type: "restored";
      outcome: OpenOutcome;
      recents: RecentFiles;
      recentFilesFailure: Option<string>;
    }>
  | Readonly<{ type: "settled"; outcome: OpenOutcome; recents: RecentFiles }>
  | Readonly<{ type: "activate"; path: string }>
  | Readonly<{ type: "close"; path: string }>;

const InitialState: DocumentSessionState = {
  session: DocumentSession.Closed,
  recents: RecentFiles.Empty,
  recentFilesFailure: Option.none,
};

/**
 * 指示を状態へ反映する。`DocumentSession` を呼ぶだけで、判断は持たない（rules/hooks.md）。
 *
 * @param state 今の状態
 * @param action 反映する指示
 * @returns 反映後の状態
 */
function reduce(
  state: DocumentSessionState,
  action: DocumentSessionAction,
): DocumentSessionState {
  switch (action.type) {
    case "opening":
      return { ...state, session: DocumentSession.beginOpening(state.session) };
    case "restored":
      /*
       * 保存されている状態を読んでいる間に、利用者が別のファイルを開き始めていることが
       * ある。そのときは復元の結果を丸ごと捨てる。そちらの操作は一覧を書き出し済みで、
       * 取り込むと画面の一覧とファイルの中身が食い違う。
       */
      return DocumentSession.isClosed(state.session)
        ? {
            session: DocumentSession.finishOpening(
              DocumentSession.Closed,
              action.outcome,
            ),
            recents: action.recents,
            recentFilesFailure: action.recentFilesFailure,
          }
        : state;
    case "settled":
      return {
        ...state,
        session: DocumentSession.finishOpening(state.session, action.outcome),
        recents: action.recents,
      };
    case "activate":
      return {
        ...state,
        session: DocumentSession.activate(state.session, action.path),
      };
    case "close":
      return {
        ...state,
        session: DocumentSession.close(state.session, action.path),
      };
  }
}

/** 何も開かずに終わった結末。選ばずにダイアログを閉じたときに使う。 */
const NothingOpened: OpenOutcome = { documents: [], failure: Option.none };

/**
 * 開けずに終わったことだけを伝える結末。
 *
 * @param failure 開けなかった理由
 * @returns 1 つも読めなかったことと、その理由を運ぶ結末
 */
function failedWith(failure: DocumentOpenFailure): OpenOutcome {
  return { documents: [], failure: Option.some(failure) };
}

/**
 * 1 つのファイルを読んで、開ける形にする。
 *
 * テキストの解釈（マイグレーション判定・パース）は `DocumentJson.parse`、その結果に保存先
 * を添えるのは `OpenedDocument.fromParsed` の担当で、ここは順序だけを持つ。
 *
 * @param ipc 読み込みに使う口
 * @param path 開く先のパス
 * @returns 読めて解釈できたドキュメント。読み込み / 解釈が失敗すればその理由
 */
async function loadDocument(
  ipc: DocumentIpc,
  path: string,
): Promise<Result<OpenedDocument, DocumentOpenFailure>> {
  const loaded = await ipc.load(path);
  if (!Result.isOk(loaded)) {
    return Result.err({
      kind: "io",
      error: toDocumentAccessFailure(loaded.error),
    });
  }
  const opened = OpenedDocument.fromParsed(
    path,
    DocumentJson.parse(loaded.value),
  );
  return Result.isOk(opened)
    ? Result.ok(opened.value)
    : Result.err({ kind: "unparsable", errors: opened.error });
}

/**
 * 決まったパスのファイルをまとめて開く（docs/01-file-format.md の表 /
 * docs/05-architecture.md「Tauri IPC」）。
 *
 * 1 件ずつ開いて呼び出し側で繰り返すのではなく、まとまりで受け取る
 * （rules/coding.md「反復を関数の内側へ移す」）。1 件ずつ状態を更新すると、後から解決した
 * 読み込みが先に解決したものを載せていない並びで上書きする。
 *
 * @param ipc 読み込みに使う口
 * @param paths 開く先のパス
 * @returns 読めたものと、最初の失敗
 */
async function openAtPaths(
  ipc: DocumentIpc,
  paths: readonly string[],
): Promise<OpenOutcome> {
  const loaded = await Promise.all(
    paths.map((path) => loadDocument(ipc, path)),
  );
  const documents = loaded.flatMap((result) =>
    Result.isOk(result) ? [result.value] : [],
  );
  const failures = loaded.flatMap((result) =>
    Result.isOk(result) ? [] : [result.error],
  );
  return { documents, failure: ArrayEx.first(failures) };
}

/**
 * 既存のファイルを選ばせて開く。
 *
 * @param ports ダイアログと I/O の相手
 * @returns 開けた結末。選ばずに閉じたら何も開かずに終わった結末
 */
async function openWithDialog({
  ipc,
  dialog,
}: DocumentSessionPorts): Promise<OpenOutcome> {
  const chosen = await dialog.chooseOpenPath();
  if (!Result.isOk(chosen)) {
    return failedWith({ kind: "dialog", error: chosen.error });
  }
  if (!Option.isSome(chosen.value)) {
    return NothingOpened;
  }
  return openAtPaths(ipc, [chosen.value.value]);
}

/**
 * 雛形から新しいドキュメントを作り、選ばれた保存先に置く。
 *
 * 自動保存も「ファイルに載っている内容」を基準に差分を見るので、最初の 1 回はここで載せて
 * おく。
 *
 * @param ports ダイアログと I/O の相手
 * @returns 作れた結末。選ばずに閉じたら何も開かずに終わった結末
 */
async function createWithDialog({
  ipc,
  dialog,
}: DocumentSessionPorts): Promise<OpenOutcome> {
  const chosen = await dialog.chooseSavePath();
  if (!Result.isOk(chosen)) {
    return failedWith({ kind: "dialog", error: chosen.error });
  }
  if (!Option.isSome(chosen.value)) {
    return NothingOpened;
  }

  const created = OpenedDocument.createFromTemplate(chosen.value.value);
  const saved = await ipc.save(
    created.path,
    DocumentJson.serialize(created.document),
  );
  if (!Result.isOk(saved)) {
    return failedWith({
      kind: "io",
      error: toDocumentAccessFailure(saved.error),
    });
  }
  return { documents: [created], failure: Option.none };
}

/**
 * 保存されている最近使ったファイルの一覧を読む。
 *
 * @param appState 読み込み元
 * @returns 保存されていた一覧。まだ一度も保存していなければ空の一覧。読み出せない /
 *   解釈できないときは、診断用の原文を持つ失敗
 */
async function loadRecentFiles(
  appState: AppStateIpc,
): Promise<Result<RecentFiles, string>> {
  const loaded = await appState.load();
  if (!Result.isOk(loaded)) {
    return Result.err(loaded.error.message);
  }
  if (!Option.isSome(loaded.value)) {
    return Result.ok(RecentFiles.Empty);
  }
  const parsed = AppStateJson.parse(loaded.value.value);
  return Result.isOk(parsed)
    ? Result.ok(RecentFiles.create(parsed.value.recentPaths))
    : Result.err(parsed.error.message);
}

/**
 * 開けたファイルを一覧の先頭へ記録して書き出す。
 *
 * 一度に複数開いたときは開いた順に記録するので、最後に開いたものが先頭に来る。
 *
 * @param appState 書き出し先
 * @param recents 開く前の一覧
 * @param documents 開けたドキュメント
 * @returns 開けたパスを先頭に持つ一覧。1 つも開けていなければ元の一覧のまま
 */
function rememberOpened(
  appState: AppStateIpc,
  recents: RecentFiles,
  documents: readonly OpenedDocument[],
): RecentFiles {
  if (documents.length === 0) {
    return recents;
  }
  const opened = documents.reduce(
    (carried, document) => RecentFiles.withOpenedPath(carried, document.path),
    recents,
  );
  /*
   * 書き出せなくても画面には出さない。開く操作そのものは成立していて、失われるのは
   * 次の起動で並ぶ一覧だけなので、今の操作を止める理由にならない。
   */
  void appState.save(AppStateJson.serialize({ recentPaths: opened.paths }));
  return opened;
}

/**
 * どのドキュメントを開いているかと最近使ったファイルを持ち、開く / 新規作成とタブの行き来
 * の導線を返す。
 *
 * 開く操作が終わると開いているドキュメントと最近使ったファイルの一覧が一緒に動き、更新の
 * 型も複数あるので `useReducer` で 1 つの状態にまとめる（rules/hooks.md）。指示を受け取れ
 * なかった経路は購読の Effect だけが更新する独立した値なので `useState` のまま持つ。
 *
 * @param ports ダイアログ・I/O・メニュー・ドロップ・アプリ自身の状態の相手
 * @returns 今のセッション、最近開いたファイルのパス（新しい順）、その一覧を読み取れ
 *   なかった理由（読めていれば `none`）、開く / 新規作成を始める手続き、開いているものを
 *   行き来する手続き、指示を受け取れなかった経路とその理由（どちらも受け取れていれば
 *   `none`）
 */
export function useDocumentSession(ports: DocumentSessionPorts): Readonly<{
  session: DocumentSession;
  recentPaths: readonly string[];
  recentFilesFailure: Option<string>;
  actions: DocumentSessionActions;
  tabActions: DocumentTabActions;
  commandFailure: Option<CommandSourceFailure>;
}> {
  const [state, dispatch] = useReducer(reduce, InitialState);
  const [commandFailure, setCommandFailure] = useState<
    Option<CommandSourceFailure>
  >(Option.none);

  /**
   * 開く操作を 1 つ始める。
   *
   * 既に始まっているなら捨てる。
   *
   * @param start 開く手続き
   */
  const begin = (start: () => Promise<OpenOutcome>): void => {
    if (DocumentSession.isOpening(state.session)) {
      return;
    }
    const opening = state.recents;
    dispatch({ type: "opening" });
    void start().then((outcome) => {
      const recents = rememberOpened(
        ports.appState,
        opening,
        outcome.documents,
      );
      dispatch({ type: "settled", outcome, recents });
    });
  };

  const openDocument = (): void => {
    begin(() => openWithDialog(ports));
  };
  const createDocument = (): void => {
    begin(() => createWithDialog(ports));
  };
  const openDocumentsAt = (paths: readonly string[]): void => {
    begin(() => openAtPaths(ports.ipc, paths));
  };

  /*
   * 届いた指示の解釈は購読の張り直しと関係がないため Effect Event に出す。
   * これが無いと、レンダーのたびに変わるハンドラを Effect の依存に入れることになり、
   * 開くたびに購読が張り直されて、その隙間に届いた指示を落とす。
   */
  const runMenuCommand = useEffectEvent((command: AppMenuCommand) => {
    /*
     * 指示ごとの始め方。`satisfies Record<AppMenuCommand, …>` が網羅を強制する
     * （メニューへ項目を足すとここがコンパイルエラーになる）。`switch` にしないのは、
     * 戻り値の無い出し分けでは case が抜けても型で気づけないため。
     */
    const start = {
      open: openDocument,
      create: createDocument,
    } as const satisfies Readonly<Record<AppMenuCommand, () => void>>;
    start[command]();
  });

  const openDropped = useEffectEvent((paths: readonly string[]) => {
    openDocumentsAt(paths);
  });

  useEffect(() => {
    let ignore = false;

    /**
     * 保存されている一覧を読み、前回開いていたファイルがあれば開く。
     *
     * 読み取れなかったときは空の一覧から始め、その理由を開始画面へ出す。次に開いた
     * ファイルで保存されている中身は書き直されるので、読めない状態は持ち越さない。
     *
     * 復元そのものでは一覧を書き出さない。開く対象は一覧の先頭なので並びが変わらない。
     */
    const restore = async (): Promise<void> => {
      const loaded = await loadRecentFiles(ports.appState);
      const recents = Result.isOk(loaded) ? loaded.value : RecentFiles.Empty;
      const recentFilesFailure = Result.isOk(loaded)
        ? Option.none
        : Option.some(loaded.error);
      const latest = RecentFiles.latest(recents);
      const outcome = Option.isSome(latest)
        ? await openAtPaths(ports.ipc, [latest.value])
        : NothingOpened;
      if (ignore) {
        return;
      }
      dispatch({ type: "restored", outcome, recents, recentFilesFailure });
    };
    void restore();

    return () => {
      ignore = true;
    };
  }, [ports.appState, ports.ipc]);

  useEffect(() => {
    let stopped = false;
    const unsubscribes: (() => void)[] = [];

    /**
     * 張れた購読を解除できるように控え、張れなければその経路の失敗を返す。
     *
     * @param source どの経路の購読か
     * @param subscribed 購読の結果
     * @returns 張れなかった理由。張れていれば `none`
     */
    const hold = (
      source: CommandSource,
      subscribed: Result<Unsubscribe, Readonly<{ message: string }>>,
    ): Option<CommandSourceFailure> => {
      if (!Result.isOk(subscribed)) {
        return Option.some({ source, message: subscribed.error.message });
      }
      if (stopped) {
        subscribed.value();
        return Option.none;
      }
      unsubscribes.push(subscribed.value);
      return Option.none;
    };

    const start = async (): Promise<void> => {
      const menu = hold(
        CommandSources.Menu,
        await ports.menu.subscribeCommand(runMenuCommand),
      );
      const drop = hold(
        CommandSources.Drop,
        await ports.drop.subscribeDropped(openDropped),
      );
      // 両方落ちたらメニュー側を出す。1 行に 2 つ並べても、直せることは変わらない。
      setCommandFailure(Option.isSome(menu) ? menu : drop);
    };
    void start();

    return () => {
      stopped = true;
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    };
  }, [ports.menu, ports.drop]);

  return {
    session: state.session,
    recentPaths: state.recents.paths,
    recentFilesFailure: state.recentFilesFailure,
    actions: { openDocument, createDocument, openDocumentsAt },
    tabActions: {
      activate: (path) => dispatch({ type: "activate", path }),
      close: (path) => dispatch({ type: "close", path }),
    },
    commandFailure,
  };
}

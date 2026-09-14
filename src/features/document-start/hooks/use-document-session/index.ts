import { useEffect, useEffectEvent, useReducer, useState } from "react";
import { OpenedDocument } from "@/domains/session/opened-document";
import { DocumentSession } from "@/features/document-start/domains/document-session";
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
  openDocumentAt: (path: string) => void;
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
      session: DocumentSession;
      recents: RecentFiles;
      recentFilesFailure: Option<string>;
    }>
  | Readonly<{
      type: "settled";
      session: DocumentSession;
      recents: RecentFiles;
    }>;

const InitialState: DocumentSessionState = {
  session: DocumentSession.Closed,
  recents: RecentFiles.Empty,
  recentFilesFailure: Option.none,
};

/**
 * 指示を状態へ反映する。
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
      return { ...state, session: DocumentSession.Opening };
    case "restored":
      /*
       * 保存されている状態を読んでいる間に、利用者が別のファイルを開き始めていることが
       * ある。そのときは復元の結果を丸ごと捨てる。そちらの操作は一覧を書き出し済みで、
       * 取り込むと画面の一覧とファイルの中身が食い違う。
       */
      return DocumentSession.isClosed(state.session)
        ? {
            session: action.session,
            recents: action.recents,
            recentFilesFailure: action.recentFilesFailure,
          }
        : state;
    case "settled":
      return { ...state, session: action.session, recents: action.recents };
  }
}

/**
 * 読み込んだテキストを解釈して、開いている状態にする。
 *
 * @param path 読んだ先のパス
 * @param content 読み取ったテキスト
 * @returns 解釈できたら開いている状態、できなければその理由を持つ失敗の状態
 */
function toOpenedSession(path: string, content: string): DocumentSession {
  const opened = OpenedDocument.fromParsed(path, DocumentJson.parse(content));
  return Result.isOk(opened)
    ? DocumentSession.opened(opened.value)
    : DocumentSession.failed({ kind: "unparsable", errors: opened.error });
}

/**
 * 決まったパスのファイルを開く。
 *
 * @param ipc 読み込みに使う口
 * @param path 開く先のパス
 * @returns 開けたら開いている状態。読み込み / 解釈が失敗すればその理由を持つ失敗の状態
 */
async function openAtPath(
  ipc: DocumentIpc,
  path: string,
): Promise<DocumentSession> {
  const loaded = await ipc.load(path);
  if (!Result.isOk(loaded)) {
    return DocumentSession.failed({
      kind: "io",
      error: toDocumentAccessFailure(loaded.error),
    });
  }
  return toOpenedSession(path, loaded.value);
}

/**
 * 既存のファイルを開く（docs/01-file-format.md の表 / docs/05-architecture.md「Tauri IPC」）。
 *
 * テキストの解釈（マイグレーション判定・パース）は `DocumentJson.parse`、その結果に
 * 保存先を添えるのは `OpenedDocument.fromParsed` の担当で、ここは「選ばせて、読んで、
 * 解釈へ渡す」順序だけを持つ。
 *
 * @param ports ダイアログと I/O の相手
 * @param canceled 選ばずに閉じたときに戻す状態。開く操作が無かったことにするため、
 *   既に開いているドキュメントを閉じてしまわない。
 * @returns 開けたら開いている状態。ダイアログ / 読み込み / 解釈のどれかが失敗すれば
 *   その理由を持つ失敗の状態。選ばずに閉じたら `canceled`
 */
async function openWithDialog(
  { ipc, dialog }: DocumentSessionPorts,
  canceled: DocumentSession,
): Promise<DocumentSession> {
  const chosen = await dialog.chooseOpenPath();
  if (!Result.isOk(chosen)) {
    return DocumentSession.failed({ kind: "dialog", error: chosen.error });
  }
  if (!Option.isSome(chosen.value)) {
    return canceled;
  }
  return openAtPath(ipc, chosen.value.value);
}

/**
 * 雛形から新しいドキュメントを作り、選ばれた保存先に置く。
 *
 * 自動保存も「ファイルに載っている内容」を基準に差分を見るので、最初の 1 回はここで載せて
 * おく。
 *
 * @param ports ダイアログと I/O の相手
 * @param canceled 選ばずに閉じたときに戻す状態。
 * @returns 作れたら開いている状態。ダイアログ / 書き出しが失敗すればその理由を持つ
 *   失敗の状態。選ばずに閉じたら `canceled`
 */
async function createWithDialog(
  { ipc, dialog }: DocumentSessionPorts,
  canceled: DocumentSession,
): Promise<DocumentSession> {
  const chosen = await dialog.chooseSavePath();
  if (!Result.isOk(chosen)) {
    return DocumentSession.failed({ kind: "dialog", error: chosen.error });
  }
  if (!Option.isSome(chosen.value)) {
    return canceled;
  }

  const created = OpenedDocument.createFromTemplate(chosen.value.value);
  const saved = await ipc.save(
    created.path,
    DocumentJson.serialize(created.document),
  );
  if (!Result.isOk(saved)) {
    return DocumentSession.failed({
      kind: "io",
      error: toDocumentAccessFailure(saved.error),
    });
  }
  return DocumentSession.opened(created);
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
 * @param appState 書き出し先
 * @param recents 開く前の一覧
 * @param session 開く操作の結果
 * @returns 開けていればそのパスを先頭に持つ一覧。開けていなければ元の一覧のまま
 */
function rememberOpened(
  appState: AppStateIpc,
  recents: RecentFiles,
  session: DocumentSession,
): RecentFiles {
  const path = DocumentSession.openedPath(session);
  if (!Option.isSome(path)) {
    return recents;
  }
  const opened = RecentFiles.withOpenedPath(recents, path.value);
  /*
   * 書き出せなくても画面には出さない。開く操作そのものは成立していて、失われるのは
   * 次の起動で並ぶ一覧だけなので、今の操作を止める理由にならない。
   */
  void appState.save(AppStateJson.serialize({ recentPaths: opened.paths }));
  return opened;
}

/**
 * どのドキュメントを開いているかと最近使ったファイルを持ち、開く / 新規作成の導線を返す。
 *
 * 開く操作が終わると、開いているドキュメントと最近使ったファイルの一覧が一緒に動くので
 * `useReducer` で 1 つの状態にまとめる（rules/hooks.md）。指示を受け取れなかった経路は
 * 購読の Effect だけが更新する独立した値なので `useState` のまま持つ。
 *
 * @param ports ダイアログ・I/O・メニュー・ドロップ・アプリ自身の状態の相手
 * @returns 今のセッション、最近開いたファイルのパス（新しい順）、その一覧を読み取れ
 *   なかった理由（読めていれば `none`）、開く / 新規作成を始める手続き、指示を受け
 *   取れなかった経路とその理由（どちらも受け取れていれば `none`）
 */
export function useDocumentSession(ports: DocumentSessionPorts): Readonly<{
  session: DocumentSession;
  recentPaths: readonly string[];
  recentFilesFailure: Option<string>;
  actions: DocumentSessionActions;
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
   * @param start 今の状態を受け取り、次の状態を返す開く手続き
   */
  const begin = (
    start: (canceled: DocumentSession) => Promise<DocumentSession>,
  ): void => {
    if (DocumentSession.isOpening(state.session)) {
      return;
    }
    const canceled = state.session;
    const opening = state.recents;
    dispatch({ type: "opening" });
    void start(canceled).then((session) => {
      const recents = rememberOpened(ports.appState, opening, session);
      dispatch({ type: "settled", session, recents });
    });
  };

  const openDocument = (): void => {
    begin((canceled) => openWithDialog(ports, canceled));
  };
  const createDocument = (): void => {
    begin((canceled) => createWithDialog(ports, canceled));
  };
  const openDocumentAt = (path: string): void => {
    begin(() => openAtPath(ports.ipc, path));
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
    // 同時に複数を開くのはスコープ外なので、先頭だけを開く。
    const first = ArrayEx.first(paths);
    if (Option.isSome(first)) {
      openDocumentAt(first.value);
    }
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
      const session = Option.isSome(latest)
        ? await openAtPath(ports.ipc, latest.value)
        : DocumentSession.Closed;
      if (ignore) {
        return;
      }
      dispatch({ type: "restored", session, recents, recentFilesFailure });
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
    actions: { openDocument, createDocument, openDocumentAt },
    commandFailure,
  };
}

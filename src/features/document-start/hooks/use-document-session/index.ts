import { useEffect, useEffectEvent, useReducer, useState } from "react";
import { OpenedDocument } from "@/domains/session/opened-document";
import {
  type DocumentOpenFailure,
  DocumentSession,
  type OpenOutcome,
} from "@/features/document-start/domains/document-session";
import type { AppMenu, AppMenuCommand } from "@/libs/app-menu";
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
 * 開く / 新規作成に必要な外部世界の口。
 *
 * どの口も「利用者がどのファイルを開くかを決める」経路なので、常に対で必要になる。
 * ダイアログとファイルの読み書きは操作の中身、メニューとドロップは操作の起こり方。
 */
export type DocumentSessionPorts = Readonly<{
  ipc: DocumentIpc;
  dialog: DocumentDialog;
  menu: AppMenu;
  drop: FileDrop;
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

/** セッションに起こること。 */
type SessionAction =
  | Readonly<{ type: "begin_opening" }>
  | Readonly<{ type: "settled"; outcome: OpenOutcome }>
  | Readonly<{ type: "canceled" }>
  | Readonly<{ type: "activate"; path: string }>
  | Readonly<{ type: "close"; path: string }>;

/**
 * セッションの状態遷移。`DocumentSession` を呼ぶだけで、判断は持たない（rules/hooks.md）。
 *
 * @param session 今のセッション
 * @param action 起きたこと
 * @returns 次のセッション
 */
function reduceSession(
  session: DocumentSession,
  action: SessionAction,
): DocumentSession {
  switch (action.type) {
    case "begin_opening":
      return DocumentSession.beginOpening(session);
    case "settled":
      return DocumentSession.finishOpening(session, action.outcome);
    case "canceled":
      return DocumentSession.cancelOpening(session);
    case "activate":
      return DocumentSession.activate(session, action.path);
    case "close":
      return DocumentSession.close(session, action.path);
  }
}

/**
 * 開けずに終わったことだけを伝える結末。
 *
 * @param failure 開けなかった理由
 * @returns 1 つも読めなかったことと、その理由を運ぶ指示
 */
function failedWith(failure: DocumentOpenFailure): SessionAction {
  return {
    type: "settled",
    outcome: { documents: [], failure: Option.some(failure) },
  };
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
): Promise<SessionAction> {
  const loaded = await Promise.all(
    paths.map((path) => loadDocument(ipc, path)),
  );
  const documents = loaded.flatMap((result) =>
    Result.isOk(result) ? [result.value] : [],
  );
  const failures = loaded.flatMap((result) =>
    Result.isOk(result) ? [] : [result.error],
  );
  return {
    type: "settled",
    outcome: { documents, failure: ArrayEx.first(failures) },
  };
}

/**
 * 既存のファイルを選ばせて開く。
 *
 * @param ports ダイアログと I/O の相手
 * @returns 開けた結末。選ばずに閉じたら、開く操作が無かったことにする指示
 */
async function openWithDialog({
  ipc,
  dialog,
}: DocumentSessionPorts): Promise<SessionAction> {
  const chosen = await dialog.chooseOpenPath();
  if (!Result.isOk(chosen)) {
    return failedWith({ kind: "dialog", error: chosen.error });
  }
  if (!Option.isSome(chosen.value)) {
    return { type: "canceled" };
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
 * @returns 作れた結末。選ばずに閉じたら、開く操作が無かったことにする指示
 */
async function createWithDialog({
  ipc,
  dialog,
}: DocumentSessionPorts): Promise<SessionAction> {
  const chosen = await dialog.chooseSavePath();
  if (!Result.isOk(chosen)) {
    return failedWith({ kind: "dialog", error: chosen.error });
  }
  if (!Option.isSome(chosen.value)) {
    return { type: "canceled" };
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
  return {
    type: "settled",
    outcome: { documents: [created], failure: Option.none },
  };
}

/**
 * どのドキュメントを開いているかを持ち、開く / 新規作成とタブの行き来の導線を返す。
 *
 * 開く操作は「ダイアログ → I/O → 解釈」と外部世界を渡り歩き、結末・やめた・行き先を移す・
 * 閉じる と更新の型が複数あるので `useReducer` を使う（rules/hooks.md）。
 *
 * @param ports ダイアログ・I/O・メニュー・ドロップの相手
 * @returns 今のセッション、開く / 新規作成を始める手続き、開いているものを行き来する
 *   手続き、指示を受け取れなかった経路とその理由（どちらも受け取れていれば `none`）
 */
export function useDocumentSession(ports: DocumentSessionPorts): Readonly<{
  session: DocumentSession;
  actions: DocumentSessionActions;
  tabActions: DocumentTabActions;
  commandFailure: Option<CommandSourceFailure>;
}> {
  const [session, dispatch] = useReducer(reduceSession, DocumentSession.Closed);
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
  const begin = (start: () => Promise<SessionAction>): void => {
    if (DocumentSession.isOpening(session)) {
      return;
    }
    dispatch({ type: "begin_opening" });
    void start().then(dispatch);
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
    session,
    actions: { openDocument, createDocument, openDocumentsAt },
    tabActions: {
      activate: (path) => dispatch({ type: "activate", path }),
      close: (path) => dispatch({ type: "close", path }),
    },
    commandFailure,
  };
}

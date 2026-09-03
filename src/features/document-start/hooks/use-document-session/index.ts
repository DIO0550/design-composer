import { useEffect, useEffectEvent, useState } from "react";
import { OpenedDocument } from "@/domains/session/opened-document";
import { DocumentSession } from "@/features/document-start/domains/document-session";
import type { AppMenu, AppMenuCommand } from "@/libs/app-menu";
import type { DocumentDialog } from "@/libs/document-dialog";
import { type DocumentIpc, toDocumentAccessFailure } from "@/libs/document-ipc";
import { DocumentJson } from "@/libs/document-json";
import type { FileDrop } from "@/libs/file-drop";
import type { Unsubscribe } from "@/libs/tauri-ipc";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";
import type { Result } from "@/utils/Result";

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
  openDocumentAt: (path: string) => void;
}>;

/**
 * 読み込んだテキストを解釈して、開いている状態にする。
 *
 * @param path 読んだ先のパス
 * @param content 読み取ったテキスト
 * @returns 解釈できたら開いている状態、できなければその理由を持つ失敗の状態
 */
function toOpenedSession(path: string, content: string): DocumentSession {
  const opened = OpenedDocument.fromParsed(path, DocumentJson.parse(content));
  return opened.ok
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
  if (!loaded.ok) {
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
  if (!chosen.ok) {
    return DocumentSession.failed({ kind: "dialog", error: chosen.error });
  }
  if (!chosen.value.some) {
    return canceled;
  }
  return openAtPath(ipc, chosen.value.value);
}

/**
 * 雛形から新しいドキュメントを作り、選ばれた保存先に置く。
 *
 * 開く前に書き出すのは、Rust 側の `watch_document` が監視開始時に現在の内容を読むため
 * （実体の無いパスでは監視を張れない / #30）。自動保存も「ファイルに載っている内容」を
 * 基準に差分を見るので、最初の 1 回はここで載せておく。
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
  if (!chosen.ok) {
    return DocumentSession.failed({ kind: "dialog", error: chosen.error });
  }
  if (!chosen.value.some) {
    return canceled;
  }

  const created = OpenedDocument.createFromTemplate(chosen.value.value);
  const saved = await ipc.save(
    created.path,
    DocumentJson.serialize(created.document),
  );
  if (!saved.ok) {
    return DocumentSession.failed({
      kind: "io",
      error: toDocumentAccessFailure(saved.error),
    });
  }
  return DocumentSession.opened(created);
}

/**
 * どのドキュメントを開いているかを持ち、開く / 新規作成の導線を返す。
 *
 * 開く操作は「ダイアログ → I/O → 解釈」と外部世界を渡り歩くが、状態は 1 つ
 * （`DocumentSession`）にまとまっているので `useReducer` にはしない（rules/hooks.md）。
 *
 * @param ports ダイアログ・I/O・メニュー・ドロップの相手
 * @returns 今のセッション、開く / 新規作成を始める手続き、指示を受け取れなかった
 *   経路とその理由（どちらも受け取れていれば `none`）
 */
export function useDocumentSession(ports: DocumentSessionPorts): Readonly<{
  session: DocumentSession;
  actions: DocumentSessionActions;
  commandFailure: Option<CommandSourceFailure>;
}> {
  const [session, setSession] = useState<DocumentSession>(
    DocumentSession.Closed,
  );
  const [commandFailure, setCommandFailure] = useState<
    Option<CommandSourceFailure>
  >(Option.none);

  /**
   * 開く操作を 1 つ始める。
   *
   * 既に始まっているなら捨てる。ネイティブメニューとドロップには押せなくする手段が
   * 無く、`Opening` 中に始めると、その時点の状態（`Opening`）が「選ばずに閉じた」
   * ときの戻り先になって読み込み中から戻れなくなるため。
   *
   * @param start 今の状態を受け取り、次の状態を返す開く手続き
   */
  const begin = (
    start: (canceled: DocumentSession) => Promise<DocumentSession>,
  ): void => {
    if (DocumentSession.isOpening(session)) {
      return;
    }
    const canceled = session;
    setSession(DocumentSession.Opening);
    void start(canceled).then(setSession);
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
    // 同時に複数を開くのは #375 でスコープ外なので、先頭だけを開く。
    const first = ArrayEx.first(paths);
    if (first.some) {
      openDocumentAt(first.value);
    }
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
      if (!subscribed.ok) {
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
      setCommandFailure(menu.some ? menu : drop);
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
    actions: { openDocument, createDocument, openDocumentAt },
    commandFailure,
  };
}

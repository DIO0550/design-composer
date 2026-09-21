import { act, renderHook } from "@testing-library/react";
import type { DesignDocument } from "@/domains/dcmp/design-document";
import { OpenedDocuments } from "@/domains/session/opened-documents";
import type { DocumentSession } from "@/features/editor/features/document-start/domains/document-session";
import type { CommandSourceFailure } from "@/features/editor/features/document-start/hooks/use-document-session";
import type { AppMenuCommand } from "@/libs/app-menu";
import { AppMenuFake } from "@/libs/app-menu/fake";
import { AppStateIpcFake } from "@/libs/app-state-ipc/fake";
import { AppStateJson } from "@/libs/app-state-json";
import {
  type DialogChoices,
  DocumentDialogFake,
} from "@/libs/document-dialog/fake";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { FileDropFake } from "@/libs/file-drop/fake";
import { Option } from "@/utils/Option";
import { useDocumentSession } from "../index";

/**
 * 保存されているアプリ自身の状態のテキストを組み立てる。
 *
 * @param recentPaths 保存されている一覧（新しい順）
 * @returns `app-state.json` に置かれているテキスト
 */
export function storedRecentPaths(recentPaths: readonly string[]): string {
  return AppStateJson.serialize({ recentPaths });
}

/** 既に置いてあるファイル。 */
export const Path = "/work/login.dcmp";
/** もう 1 つ置いてあるファイル。複数開いた状態を作るのに使う。 */
export const OtherPath = "/work/settings.dcmp";
/** 新規作成の保存先。まだ置かれていないパス。 */
export const NewPath = "/work/untitled.dcmp";

/**
 * 開いているドキュメントのパスを並び順に読む。
 *
 * @param session 読む相手
 * @returns 開いた順に並んだパス。1 つも開いていなければ空
 */
export function openedPaths(session: DocumentSession): readonly string[] {
  return Option.isSome(session.documents)
    ? OpenedDocuments.documents(session.documents.value).map(
        (document) => document.path,
      )
    : [];
}

/**
 * 今見ているドキュメントの中身。
 *
 * @param session 読む相手
 * @returns 見ているドキュメント。1 つも開いていなければ `none`
 */
export function activeDocument(
  session: DocumentSession,
): Option<DesignDocument> {
  return Option.map(session.documents, (opened) => opened.active.document);
}

export type SessionObserver = Readonly<{
  /** インメモリのファイル表。書き出された内容の確認に使う。 */
  files: DocumentIpcFake;
  /** インメモリのアプリ自身の状態。書き出された生のテキストの確認に使う。 */
  appState: AppStateIpcFake;
  /** 現在のセッション。 */
  session: () => DocumentSession;
  /** 保存されている一覧を読み取れなかった理由。読めていれば `none`。 */
  recentFilesFailure: () => Option<string>;
  /** 最近開いたファイルのパス（新しい順）。 */
  recentPaths: () => readonly string[];
  /** 開く指示を受け取れなかった経路とその理由。 */
  commandFailure: () => Option<CommandSourceFailure>;
  /**
   * 購読が張られる（あるいは張れずに終わる）のを待つ。
   * 購読は描画のあとに非同期で成立するので、指示を起こす前にここで待ち合わせる。
   */
  settle: () => Promise<void>;
  /** 「開く」を押し、開く操作が終わるまで待つ。 */
  openDocument: () => Promise<void>;
  /** 「新規作成」を押し、作成が終わるまで待つ。 */
  createDocument: () => Promise<void>;
  /** OS のメニューから項目を選び、その操作が終わるまで待つ。 */
  chooseMenu: (command: AppMenuCommand) => Promise<void>;
  /** ウィンドウへファイルを落とし、開く操作が終わるまで待つ。 */
  dropFiles: (paths: readonly string[]) => Promise<void>;
  /** そのパスのタブへ移る。 */
  activateTab: (path: string) => Promise<void>;
  /** そのパスのタブを閉じる。 */
  closeTab: (path: string) => Promise<void>;
}>;

/** 代役の口を用意するときの追加の指定。 */
export type SessionPortOptions = Readonly<{
  /** 既に保存されているアプリ自身の状態の生のテキスト。 */
  storedAppState?: string;
  /** アプリ自身の状態の読み込みを拒むようにするか。 */
  denyAppStateLoad?: boolean;
  /** アプリ自身の状態の書き出しを拒むようにするか。 */
  denyAppStateSave?: boolean;
  /** メニューの購読を張れないようにするか。 */
  denyMenu?: boolean;
  /** ドロップの購読を張れないようにするか。 */
  denyDrop?: boolean;
}>;

/**
 * 置いてあるファイルと、利用者がダイアログで行う選択を決めてフックを描画する。
 * 開く操作はダイアログと I/O を挟んで非同期に進むので、押した後の待ち合わせも
 * ここに閉じる。
 */
export function renderDocumentSession(
  files: Readonly<Record<string, string>>,
  choices: DialogChoices,
  options: SessionPortOptions = {},
): SessionObserver {
  const ipcFake = DocumentIpcFake.create(files);
  const dialogFake = DocumentDialogFake.create(choices);
  const menuFake = AppMenuFake.create();
  const dropFake = FileDropFake.create();
  const appStateFake = AppStateIpcFake.create(options.storedAppState);
  if (options.denyAppStateLoad === true) {
    appStateFake.denyLoad();
  }
  if (options.denyAppStateSave === true) {
    appStateFake.denySave();
  }
  if (options.denyMenu === true) {
    menuFake.denySubscribe();
  }
  if (options.denyDrop === true) {
    dropFake.denySubscribe();
  }

  const ports = {
    ipc: ipcFake.ipc,
    dialog: dialogFake.dialog,
    menu: menuFake.menu,
    drop: dropFake.drop,
    appState: appStateFake.ipc,
  };
  const { result } = renderHook(() => useDocumentSession(ports));

  /** 進行中の購読・開く操作が落ち着くまで待つ。 */
  const settle = (): Promise<void> => act(async () => {});

  return {
    files: ipcFake,
    appState: appStateFake,
    session: () => result.current.session,
    recentFilesFailure: () => result.current.recentFilesFailure,
    recentPaths: () => result.current.recentPaths,
    commandFailure: () => result.current.commandFailure,
    settle,
    openDocument: () =>
      act(async () => {
        result.current.actions.openDocument();
      }),
    createDocument: () =>
      act(async () => {
        result.current.actions.createDocument();
      }),
    chooseMenu: async (command) => {
      await settle();
      await act(async () => {
        menuFake.choose(command);
      });
    },
    dropFiles: async (paths) => {
      await settle();
      await act(async () => {
        dropFake.dropFiles(paths);
      });
    },
    activateTab: (path) =>
      act(async () => {
        result.current.tabActions.activate(path);
      }),
    closeTab: (path) =>
      act(async () => {
        result.current.tabActions.close(path);
      }),
  };
}

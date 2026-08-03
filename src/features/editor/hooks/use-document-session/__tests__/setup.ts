import { act, renderHook } from "@testing-library/react";
import type { DocumentSession } from "@/features/editor/domains/document-session";
import {
  type DialogChoices,
  DocumentDialogFake,
} from "@/libs/document-dialog/fake";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { useDocumentSession } from "../index";

/** 既に置いてあるファイル。テストの中で開いているファイルは常に 1 つ。 */
export const PATH = "/work/login.dcmp";

export type SessionObserver = Readonly<{
  /** インメモリのファイル表。書き出された内容の確認に使う。 */
  files: DocumentIpcFake;
  /** 現在のセッション。 */
  session: () => DocumentSession;
  /** 「開く」を押し、開く操作が終わるまで待つ。 */
  openDocument: () => Promise<void>;
  /** 「新規作成」を押し、作成が終わるまで待つ。 */
  createDocument: () => Promise<void>;
}>;

/**
 * 置いてあるファイルと、利用者がダイアログで行う選択を決めてフックを描画する。
 * 開く操作はダイアログと I/O を挟んで非同期に進むので、押した後の待ち合わせも
 * ここに閉じる。
 */
export function renderDocumentSession(
  files: Readonly<Record<string, string>>,
  choices: DialogChoices,
): SessionObserver {
  const ipcFake = DocumentIpcFake.create(files);
  const dialogFake = DocumentDialogFake.create(choices);
  const { result } = renderHook(() =>
    useDocumentSession({ ipc: ipcFake.ipc, dialog: dialogFake.dialog }),
  );

  return {
    files: ipcFake,
    session: () => result.current.session,
    openDocument: () =>
      act(async () => {
        result.current.openDocument();
      }),
    createDocument: () =>
      act(async () => {
        result.current.createDocument();
      }),
  };
}

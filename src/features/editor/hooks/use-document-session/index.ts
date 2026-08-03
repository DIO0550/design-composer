import { useState } from "react";
import { DocumentSession } from "@/features/editor/domains/document-session";
import { OpenedDocument } from "@/features/editor/domains/opened-document";
import type { DocumentDialog } from "@/libs/document-dialog";
import type { DocumentIpc } from "@/libs/document-ipc";
import { DocumentJson } from "@/libs/document-json";

/**
 * 開く / 新規作成に必要な外部世界の口。
 * どちらの操作も「利用者にパスを選ばせてから読み書きする」ので、常に対で必要になる。
 */
export type DocumentSessionPorts = Readonly<{
  ipc: DocumentIpc;
  dialog: DocumentDialog;
}>;

/**
 * 既存のファイルを開く（docs/01-file-format.md の表 / docs/05-architecture.md「Tauri IPC」）。
 *
 * マイグレーション判定・パース・バリデーションは `OpenedDocument.fromContent` の担当で、
 * ここは「選ばせて、読んで、解釈へ渡す」順序だけを持つ。
 *
 * @param canceled 選ばずに閉じたときに戻す状態。開く操作が無かったことにするため、
 *   既に開いているドキュメントを閉じてしまわない。
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

  const path = chosen.value.value;
  const loaded = await ipc.load(path);
  if (!loaded.ok) {
    return DocumentSession.failed({ kind: "io", error: loaded.error });
  }

  const opened = OpenedDocument.fromContent(path, loaded.value);
  return opened.ok
    ? DocumentSession.opened(opened.value)
    : DocumentSession.failed({ kind: "invalid", errors: opened.error });
}

/**
 * 雛形から新しいドキュメントを作り、選ばれた保存先に置く。
 *
 * 開く前に書き出すのは、Rust 側の `watch_document` が監視開始時に現在の内容を読むため
 * （実体の無いパスでは監視を張れない / #30）。自動保存も「ファイルに載っている内容」を
 * 基準に差分を見るので、最初の 1 回はここで載せておく。
 *
 * @param canceled 選ばずに閉じたときに戻す状態。
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
    return DocumentSession.failed({ kind: "io", error: saved.error });
  }
  return DocumentSession.opened(created);
}

/**
 * どのドキュメントを開いているかを持ち、開く / 新規作成の導線を返す。
 *
 * 開く操作は「ダイアログ → I/O → 解釈」と外部世界を渡り歩くが、状態は 1 つ
 * （`DocumentSession`）にまとまっているので `useReducer` にはしない（rules/hooks.md）。
 * 処理中は `DocumentSession.isOpening` が真になり、呼び出し側はそれをボタンの
 * `disabled` に流して二重の開始を防ぐ。
 */
export function useDocumentSession(ports: DocumentSessionPorts): Readonly<{
  session: DocumentSession;
  openDocument: () => void;
  createDocument: () => void;
}> {
  const [session, setSession] = useState<DocumentSession>(
    DocumentSession.CLOSED,
  );

  return {
    session,

    openDocument() {
      setSession(DocumentSession.OPENING);
      void openWithDialog(ports, session).then(setSession);
    },

    createDocument() {
      setSession(DocumentSession.OPENING);
      void createWithDialog(ports, session).then(setSession);
    },
  };
}

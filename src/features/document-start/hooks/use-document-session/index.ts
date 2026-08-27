import { useState } from "react";
import { OpenedDocument } from "@/domains/session/opened-document";
import { DocumentSession } from "@/features/document-start/domains/document-session";
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
 * テキストの解釈（マイグレーション判定・パース）は `DocumentJson.parse`、その結果を
 * 開いた状態かエラー一覧かへ振り分けるのは `OpenedDocument.fromParsed` の担当で、
 * ここは「選ばせて、読んで、解釈へ渡す」順序だけを持つ。
 *
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

  const path = chosen.value.value;
  const loaded = await ipc.load(path);
  if (!loaded.ok) {
    return DocumentSession.failed({ kind: "io", error: loaded.error });
  }

  const opened = OpenedDocument.fromParsed(
    path,
    DocumentJson.parse(loaded.value),
  );
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
 *
 * @param ports ダイアログと I/O の相手
 * @returns 今のセッションと、開く / 新規作成を始める手続き
 */
export function useDocumentSession(ports: DocumentSessionPorts): Readonly<{
  session: DocumentSession;
  openDocument: () => void;
  createDocument: () => void;
}> {
  const [session, setSession] = useState<DocumentSession>(
    DocumentSession.Closed,
  );

  return {
    session,

    openDocument() {
      setSession(DocumentSession.Opening);
      void openWithDialog(ports, session).then(setSession);
    },

    createDocument() {
      setSession(DocumentSession.Opening);
      void createWithDialog(ports, session).then(setSession);
    },
  };
}

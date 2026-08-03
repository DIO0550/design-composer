import type { DocumentError } from "@/features/editor/domains/document-error";
import type { OpenedDocument } from "@/features/editor/domains/opened-document";
import type { DocumentDialogError } from "@/libs/document-dialog";
import type { DocumentIpcError } from "@/libs/document-ipc";
import { Option } from "@/utils/Option";

/**
 * 開けなかった理由。
 *
 * 由来ごとに画面へ出すものが変わる（不正なファイルはエラー一覧、I/O とダイアログは
 * 1 行のメッセージ）ため、1 つのメッセージへ潰さずに分けて持つ。
 */
export type DocumentOpenFailure =
  | Readonly<{ kind: "dialog"; error: DocumentDialogError }>
  | Readonly<{ kind: "io"; error: DocumentIpcError }>
  | Readonly<{ kind: "invalid"; errors: readonly DocumentError[] }>;

/**
 * アプリがどのドキュメントを開いているか（docs/01-file-format.md「ファイル」/
 * docs/05-architecture.md「Tauri IPC」）。
 *
 * 「開いているのに開けなかった理由がある」「読み込み中なのにドキュメントもある」といった
 * 組み合わせを作れないよう、取りうる状態を直和で列挙する。
 */
export type DocumentSession =
  | Readonly<{ kind: "closed" }>
  | Readonly<{ kind: "opening" }>
  | Readonly<{ kind: "failed"; failure: DocumentOpenFailure }>
  | Readonly<{ kind: "opened"; opened: OpenedDocument }>;

/**
 * ドキュメントを開いていない状態。
 * 開始画面が受け取れる範囲を型で閉じ、開いているセッションを渡せないようにする。
 */
export type UnopenedSession = Exclude<DocumentSession, { kind: "opened" }>;

const CLOSED: DocumentSession = { kind: "closed" };
const OPENING: DocumentSession = { kind: "opening" };

export const DocumentSession = {
  /** まだ何も開いていない状態。アプリはここから始まる。 */
  CLOSED,
  /** 選択・読み込みの最中。 */
  OPENING,

  opened(opened: OpenedDocument): DocumentSession {
    return { kind: "opened", opened };
  },

  failed(failure: DocumentOpenFailure): DocumentSession {
    return { kind: "failed", failure };
  },

  /**
   * 開く操作の最中か。
   * ボタンを `disabled` にして二重に開かせないために使う（rules/hooks.md）。
   */
  isOpening(session: DocumentSession): boolean {
    return session.kind === "opening";
  },

  /** 開いているファイルのパス。開いていなければ `none`。 */
  openedPath(session: DocumentSession): Option<string> {
    return session.kind === "opened"
      ? Option.some(session.opened.path)
      : Option.none;
  },
} as const;

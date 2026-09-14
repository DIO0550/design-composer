import type { DocumentAccessFailure } from "@/domains/session/document-access-failure";
import type { DocumentError } from "@/domains/session/document-error";
import type { OpenedDocument } from "@/domains/session/opened-document";
import { OpenedDocuments } from "@/domains/session/opened-documents";
import type { DocumentDialogError } from "@/libs/document-dialog";
import { Option } from "@/utils/Option";

/**
 * 開けなかった理由。由来ごとに画面へ出すものが変わる（解釈できなかったファイルはエラー
 * 一覧、I/O とダイアログは 1 行のメッセージ）ため、1 つのメッセージへ潰さずに分けて持つ。
 *
 * `unparsable` が運ぶのは `DocumentJson.parse` が返した失敗だけで、スキーマ検証で落ちる
 * ファイルはここへ来ずそのまま開く（docs/03-schema.md「不正ファイル時の挙動」の「開く時」）。
 */
export type DocumentOpenFailure =
  | Readonly<{ kind: "dialog"; error: DocumentDialogError }>
  | Readonly<{ kind: "io"; error: DocumentAccessFailure }>
  | Readonly<{ kind: "unparsable"; errors: readonly DocumentError[] }>;

/**
 * 開く操作がどこまで進んだか。
 *
 * 開いているドキュメントとは別に持つ。2 つを 1 本の直和へ潰すと、「開いたまま次を開いて
 * いる最中」「開いたまま直近の 1 回が失敗した」が表せない。
 */
export type OpenAttempt =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "opening" }>
  | Readonly<{ kind: "failed"; failure: DocumentOpenFailure }>;

const Idle: OpenAttempt = { kind: "idle" };
const Opening: OpenAttempt = { kind: "opening" };

export const OpenAttempt = {
  /** 開く操作が動いていない状態。 */
  Idle,
  /** 選択・読み込みの最中。 */
  Opening,

  /** 開けずに終わった状態。 */
  failed(failure: DocumentOpenFailure): OpenAttempt {
    return { kind: "failed", failure };
  },

  /**
   * 開く操作の最中か。
   * ボタンを `disabled` にして二重に開かせないために使う（rules/hooks.md）。
   */
  isOpening(attempt: OpenAttempt): boolean {
    return attempt.kind === "opening";
  },

  /** 直近の開く操作が失敗していれば、その理由。成否が決まっていなければ `none`。 */
  failure(attempt: OpenAttempt): Option<DocumentOpenFailure> {
    return attempt.kind === "failed"
      ? Option.some(attempt.failure)
      : Option.none;
  },
} as const;

/**
 * 開く操作の結末。読めたドキュメントと、最初の失敗。
 *
 * 一度に複数を開くと「一部だけ読めた」が起こるので、成否を `Result` で二択にせず両方を
 * 持つ。
 */
export type OpenOutcome = Readonly<{
  documents: readonly OpenedDocument[];
  failure: Option<DocumentOpenFailure>;
}>;

/**
 * アプリがどのドキュメントを開いていて、開く操作がどこまで進んだか
 * （docs/01-file-format.md「ファイル」/ docs/05-architecture.md「Tauri IPC」）。
 */
export type DocumentSession = Readonly<{
  documents: Option<OpenedDocuments>;
  attempt: OpenAttempt;
}>;

const Closed: DocumentSession = { documents: Option.none, attempt: Idle };

export const DocumentSession = {
  /** まだ何も開いていない状態。アプリはここから始まる。 */
  Closed,

  /** 開く操作を始める。開いているドキュメントはそのまま残す。 */
  beginOpening(session: DocumentSession): DocumentSession {
    return { documents: session.documents, attempt: Opening };
  },

  /**
   * 開く操作の結末を受け取る。読めたものを開き、失敗があればそれを残す。
   *
   * 落としたファイルは一度に複数届き、その一部だけが読めないことがある。読めた分を開か
   * ずに捨てると、1 つ壊れているだけで残り全部が開けなくなる。
   *
   * @param session 開く前のセッション
   * @param outcome 読めたドキュメントと、最初の失敗
   * @returns 最後に読めたドキュメントを見ているセッション。1 つも読めていなければ見て
   *   いるものは変わらない
   */
  finishOpening(
    session: DocumentSession,
    outcome: OpenOutcome,
  ): DocumentSession {
    const documents = outcome.documents.reduce<Option<OpenedDocuments>>(
      (carried, document) =>
        Option.isSome(carried)
          ? Option.some(OpenedDocuments.open(carried.value, document))
          : Option.some(OpenedDocuments.create(document)),
      session.documents,
    );
    const attempt = Option.isSome(outcome.failure)
      ? OpenAttempt.failed(outcome.failure.value)
      : Idle;
    return { documents, attempt };
  },

  /** 開かずに操作をやめる。直前の失敗も含めて、開く前の見え方へ戻す。 */
  cancelOpening(session: DocumentSession): DocumentSession {
    return { documents: session.documents, attempt: Idle };
  },

  /** 見ている先をそのパスへ移す。開いていないパスなら何も変わらない。 */
  activate(session: DocumentSession, path: string): DocumentSession {
    return {
      documents: Option.map(session.documents, (opened) =>
        OpenedDocuments.activate(opened, path),
      ),
      attempt: session.attempt,
    };
  },

  /** そのパスのドキュメントを閉じる。最後の 1 つを閉じると開始画面へ戻る。 */
  close(session: DocumentSession, path: string): DocumentSession {
    return {
      documents: Option.flatMap(session.documents, (opened) =>
        OpenedDocuments.close(opened, path),
      ),
      attempt: session.attempt,
    };
  },

  /**
   * 開く操作の最中か。
   * ボタンを `disabled` にして二重に開かせないために使う（rules/hooks.md）。
   */
  isOpening(session: DocumentSession): boolean {
    return OpenAttempt.isOpening(session.attempt);
  },

  /** 直近の開く操作が失敗していれば、その理由。成否が決まっていなければ `none`。 */
  failure(session: DocumentSession): Option<DocumentOpenFailure> {
    return OpenAttempt.failure(session.attempt);
  },

  /** 今見ているドキュメントのパス。1 つも開いていなければ `none`。 */
  activePath(session: DocumentSession): Option<string> {
    return Option.map(session.documents, OpenedDocuments.activePath);
  },
} as const;

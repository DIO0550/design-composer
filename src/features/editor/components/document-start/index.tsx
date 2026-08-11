import {
  DOCUMENT_ERROR_ORIGINS,
  DocumentErrorList,
} from "@/features/editor/components/document-error-list";
import type {
  DocumentOpenFailure,
  UnopenedSession,
} from "@/features/editor/domains/document-session";
import type { DocumentIpcError } from "@/libs/document-ipc";

/**
 * I/O の失敗を利用者向けの言い方にする。診断用の原文は後ろに添える。
 *
 * @param error 画面に出したい I/O の失敗
 * @returns 利用者向けの 1 行
 */
function ioFailureLabel(error: DocumentIpcError): string {
  switch (error.kind) {
    case "notFound":
      return "ファイルが見つかりません";
    case "permissionDenied":
      return "ファイルを読み書きする権限がありません";
    case "invalidPath":
      return "パスが正しくありません";
    case "invalidUtf8":
      return "UTF-8 のテキストとして読めません";
    case "io":
      return "ファイルの読み書きに失敗しました";
    case "ipcFailed":
      return "アプリ内部の呼び出しに失敗しました";
  }
}

/**
 * 開けなかった理由。
 * 不正なファイルだけは件数分の一覧になるため、1 行のメッセージとは別の見せ方をする
 * （docs/03-schema.md「不正ファイル時の挙動」）。
 */
function OpenFailure({ failure }: Readonly<{ failure: DocumentOpenFailure }>) {
  if (failure.kind === "invalid") {
    return (
      <>
        <p role="alert" className="text-red-700">
          ファイルの内容が正しくないため開けませんでした
        </p>
        <DocumentErrorList
          errors={failure.errors}
          origin={DOCUMENT_ERROR_ORIGINS.unopenedFile}
        />
      </>
    );
  }

  const label =
    failure.kind === "dialog"
      ? "ファイルの選択に失敗しました"
      : ioFailureLabel(failure.error);

  return (
    <p role="alert" className="text-red-700">
      {label}
      <span className="ml-2 font-mono text-red-900/70 text-xs">
        {failure.error.message}
      </span>
    </p>
  );
}

/**
 * ドキュメントを開いていないときの画面。
 *
 * 開く / 新規作成のボタンは常設のツールバー側にあるので、ここは案内と、
 * 開けなかった理由だけを出す。
 */
export function DocumentStart({
  session,
}: Readonly<{ session: UnopenedSession }>) {
  return (
    // relative はエラー一覧を下から重ねる基準（DocumentErrorList の置き方に合わせる）。
    <section
      aria-label="ドキュメントの開始"
      className="relative flex h-full flex-col items-center justify-center gap-2 bg-gray-100 text-gray-700 text-sm"
    >
      {session.kind === "opening" ? (
        <p>ファイルを読み込んでいます…</p>
      ) : (
        <p>ドキュメントを開くか、新しく作成してください。</p>
      )}
      {session.kind === "failed" && <OpenFailure failure={session.failure} />}
    </section>
  );
}

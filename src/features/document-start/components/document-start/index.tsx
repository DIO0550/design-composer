import type { ReactNode } from "react";
import type { DocumentError } from "@/domains/document-error";
import type {
  DocumentOpenFailure,
  UnopenedSession,
} from "@/features/document-start/domains/document-session";
import type { DocumentIpcError } from "@/libs/document-ipc";

/**
 * 開けなかったエラーを画面に並べる手段。
 *
 * 開始画面が持つのは「どの失敗のときに一覧を出すか」までで、その一覧をどう綴るかは
 * 呼び出し側が決める（この画面は一覧の部品を知らない）。
 *
 * @param errors 開こうとしたファイルが持っていた不正
 * @returns この節を基準に下端へ重ねる、エラーの一覧
 */
type RenderDocumentErrors = (errors: readonly DocumentError[]) => ReactNode;

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
function OpenFailure({
  failure,
  renderErrors,
}: Readonly<{
  failure: DocumentOpenFailure;
  renderErrors: RenderDocumentErrors;
}>) {
  if (failure.kind === "invalid") {
    return (
      <>
        <p role="alert" className="text-red-700">
          ファイルの内容が正しくないため開けませんでした
        </p>
        {renderErrors(failure.errors)}
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
  renderErrors,
}: Readonly<{
  session: UnopenedSession;
  renderErrors: RenderDocumentErrors;
}>) {
  return (
    // relative は renderErrors が返すものを下端へ重ねる基準。
    // 一覧の側は絶対位置で置かれるので、ここを外すと画面の端まで抜ける。
    <section
      aria-label="ドキュメントの開始"
      className="relative flex h-full flex-col items-center justify-center gap-2 bg-gray-100 text-gray-700 text-sm"
    >
      {session.kind === "opening" ? (
        <p>ファイルを読み込んでいます…</p>
      ) : (
        <p>ドキュメントを開くか、新しく作成してください。</p>
      )}
      {session.kind === "failed" && (
        <OpenFailure failure={session.failure} renderErrors={renderErrors} />
      )}
    </section>
  );
}

import type { ReactNode } from "react";
import type { DocumentAccessFailureReason } from "@/domains/session/document-access-failure";
import type { DocumentError } from "@/domains/session/document-error";
import type {
  DocumentOpenFailure,
  UnopenedSession,
} from "@/features/document-start/domains/document-session";

/**
 * 開けなかったエラーを画面に並べる手段。
 *
 * 開始画面が持つのは「どの失敗のときに一覧を出すか」までで、その一覧をどう綴るかは
 * 呼び出し側が決める。ここが知っているのは一覧の部品ではなく、返るものが
 * 絶対位置で下端に重なるという置かれ方だけ。
 *
 * @param errors 開こうとしたファイルを解釈できなかった理由
 * @returns この節の中で絶対位置に置かれる、エラーの一覧。位置を持たないものを返すと
 *   案内の文と一緒に中央へ流れ込む（型でもテストでも縛れないので、視覚差分で見る）
 */
type RenderDocumentErrors = (errors: readonly DocumentError[]) => ReactNode;

/**
 * I/O の失敗を利用者向けの言い方にする。診断用の原文は後ろに添える。
 *
 * 綴りを表示側に置くのは、ドメインが持つのが理由の**種別**までだから
 * （rules/architecture.md「表示のための綴りをドメインへ持ち込まない」）。
 *
 * @param reason ドキュメントの中身へ届かなかった理由
 * @returns 利用者向けの 1 行
 */
function ioFailureLabel(reason: DocumentAccessFailureReason): string {
  switch (reason) {
    case "missing":
      return "ファイルが見つかりません";
    case "notPermitted":
      return "ファイルを読み書きする権限がありません";
    case "unusablePath":
      return "パスが正しくありません";
    case "undecodableText":
      return "UTF-8 のテキストとして読めません";
    case "storageFailed":
      return "ファイルの読み書きに失敗しました";
    case "undelivered":
      return "アプリ内部の呼び出しに失敗しました";
  }
}

/**
 * 開けなかった理由。
 * 解釈できなかったファイルだけは件数分の一覧になるため、1 行のメッセージとは
 * 別の見せ方をする（docs/03-schema.md「不正ファイル時の挙動」の「開く時」）。
 */
function OpenFailure({
  failure,
  renderErrors,
}: Readonly<{
  failure: DocumentOpenFailure;
  renderErrors: RenderDocumentErrors;
}>) {
  if (failure.kind === "unparsable") {
    return (
      <>
        <p role="alert" className="text-red-700">
          ファイルをドキュメントとして読み取れなかったため開けませんでした
        </p>
        {renderErrors(failure.errors)}
      </>
    );
  }

  const label =
    failure.kind === "dialog"
      ? "ファイルの選択に失敗しました"
      : ioFailureLabel(failure.error.reason);

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
    // relative は renderErrors が返すものの包含ブロック。外すと基準がビューポートへ移り、
    // 一覧の高さの上限（画面の半分）が帯のぶんだけ広がる。happy-dom は Tailwind を
    // 解決しないのでテストでは落ちず、気づけるのは視覚差分だけ。
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

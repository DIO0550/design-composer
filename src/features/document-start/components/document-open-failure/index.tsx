import type { ReactElement, ReactNode } from "react";
import type { DocumentAccessFailureReason } from "@/domains/session/document-access-failure";
import type { DocumentError } from "@/domains/session/document-error";
import type { DocumentOpenFailure } from "@/features/document-start/domains/document-session";
import { Option } from "@/utils/Option";

/**
 * エラーを画面に並べる手段。
 *
 * 出す側が持つのは「どの失敗のときに一覧を出すか」までで、その一覧をどう綴るかは呼び出し
 * 側が決める。
 *
 * @param errors 開こうとしたファイルを解釈できなかった理由
 * @returns エラーの一覧
 */
export type RenderDocumentErrors = (
  errors: readonly DocumentError[],
) => ReactNode;

/**
 * I/O の失敗を利用者向けの言い方にする。
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
 * 開けなかった理由の、利用者向けの 1 行。
 *
 * @param failure 開けなかった理由
 * @returns 利用者向けの 1 行
 */
function failureLabel(failure: DocumentOpenFailure): string {
  switch (failure.kind) {
    case "unparsable":
      return "ファイルをドキュメントとして読み取れなかったため開けませんでした";
    case "dialog":
      return "ファイルの選択に失敗しました";
    case "io":
      return ioFailureLabel(failure.error.reason);
  }
}

/**
 * 開けなかった理由に添える診断用の原文。
 *
 * @param failure 開けなかった理由
 * @returns 原文。解釈できなかったファイルは件数分の一覧になるので持たない
 */
function failureMessage(failure: DocumentOpenFailure): Option<string> {
  return failure.kind === "unparsable"
    ? Option.none
    : Option.some(failure.error.message);
}

/**
 * 理由の文と、診断用の原文。
 *
 * 器（地・枠・要素）は置き場所ごとに違うので、着せるのは呼び出し側。
 *
 * @param label 利用者向けの 1 行
 * @param message 診断用の原文。無ければ理由の文だけを出す
 * @returns 理由の文と、原文があればその後ろに添えたもの
 */
function FailureText({
  label,
  message,
}: Readonly<{ label: string; message: Option<string> }>): ReactElement {
  return (
    <>
      {label}
      {Option.isSome(message) && (
        <span className="ml-2 font-mono text-red-900/70 text-xs">
          {message.value}
        </span>
      )}
    </>
  );
}

/**
 * 失敗を中央のカラムに 1 行で伝える（開始画面）。
 *
 * 開けなかった理由と、指示を受け取れない経路の両方がこの形で並ぶので、綴りと器をここに
 * 集めている。
 *
 * @param label 利用者向けの 1 行
 * @param message 診断用の原文。無ければ理由の文だけを出す
 * @returns 読み上げの対象になる 1 行
 */
export function FailureLine({
  label,
  message,
}: Readonly<{ label: string; message: Option<string> }>): ReactElement {
  return (
    <p role="alert" className="text-red-700">
      <FailureText label={label} message={message} />
    </p>
  );
}

/**
 * 開けなかった理由を、中央のカラムに出す（開始画面）。
 *
 * 解釈できなかったファイルだけは件数分の一覧になるため、1 行のメッセージとは別の見せ方を
 * する（docs/03-schema.md「不正ファイル時の挙動」の「開く時」）。
 *
 * @param failure 開けなかった理由
 * @param renderErrors 解釈できなかったファイルのエラー一覧の描き方。返るものは呼び出し側
 *   が用意した包含ブロックの中で絶対位置に置かれる
 * @returns 理由の 1 行と、解釈できなかった場合のエラー一覧
 */
export function DocumentOpenFailureNotice({
  failure,
  renderErrors,
}: Readonly<{
  failure: DocumentOpenFailure;
  renderErrors: RenderDocumentErrors;
}>): ReactElement {
  return (
    <>
      <FailureLine
        label={failureLabel(failure)}
        message={failureMessage(failure)}
      />
      {failure.kind === "unparsable" && renderErrors(failure.errors)}
    </>
  );
}

/**
 * 開けなかった理由を帯で出す（既にドキュメントを開いているとき）。
 *
 * 解釈できなかったファイルのエラー一覧はここへ出さない。件数分だけ伸びる一覧を 3 ペイン
 * の上へ積むと、開いているドキュメントの表示領域がその分だけ押し潰される。
 *
 * 名前を持つ `role="alert"` にするのは、同じ画面に `DocumentSyncFailureList`（ファイル同
 * 期の失敗）が並ぶため。名前の無い alert が 2 つあると、どちらを指しているか言えなくなる。
 * 地と枠をそちらと揃えているのは、どちらも「今の画面がファイルと食い違っている」を伝える
 * 帯で、見分けさせたいのは中身だから。共通の器にはしていない（feature をまたぐ）。
 *
 * @param failure 開けなかった理由
 * @returns 理由の 1 行を載せた帯
 */
export function DocumentOpenFailureBanner({
  failure,
}: Readonly<{ failure: DocumentOpenFailure }>): ReactElement {
  return (
    <section
      role="alert"
      aria-label="ファイルを開けませんでした"
      className="shrink-0 border-red-300 border-b bg-red-50 px-3 py-1 text-red-900 text-sm"
    >
      <FailureText
        label={failureLabel(failure)}
        message={failureMessage(failure)}
      />
    </section>
  );
}

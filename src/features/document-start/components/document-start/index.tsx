import type { ReactElement, ReactNode } from "react";
import type { DocumentAccessFailureReason } from "@/domains/session/document-access-failure";
import type { DocumentError } from "@/domains/session/document-error";
import type {
  DocumentOpenFailure,
  UnopenedSession,
} from "@/features/document-start/domains/document-session";
import { DocumentSession } from "@/features/document-start/domains/document-session";
import {
  type CommandSource,
  type CommandSourceFailure,
  CommandSources,
  type DocumentSessionActions,
} from "@/features/document-start/hooks/use-document-session";
import { FilePath } from "@/utils/FilePath";
import type { Option } from "@/utils/Option";

/**
 * エラーを画面に並べる手段。
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
 * 失敗の理由と、その原文を並べた 1 行。
 *
 * @param label 利用者向けの言い方
 * @param message 診断用の原文
 * @returns 読み上げの対象になる 1 行
 */
function FailureLine({
  label,
  message,
}: Readonly<{ label: string; message: string }>): ReactElement {
  return (
    <p role="alert" className="text-red-700">
      {label}
      <span className="ml-2 font-mono text-red-900/70 text-xs">{message}</span>
    </p>
  );
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

  return <FailureLine label={label} message={failure.error.message} />;
}

/**
 * 開く指示を受け取れない経路を、利用者向けの言い方にする。
 *
 * 経路ごとに出し分けるのは、片方だけ使えないときに、生きている側まで壊れていると
 * 読める文言にしないため（`switch` に `default` を置かず、経路を足したらここで気づく）。
 *
 * @param source 受け取れなかった経路
 * @returns 利用者向けの 1 行
 */
function commandSourceFailureLabel(source: CommandSource): string {
  switch (source) {
    case CommandSources.Menu:
      return "メニューからの操作を受け取れません";
    case CommandSources.Drop:
      return "ファイルのドロップを受け取れません";
  }
}

/** 押せる導線の共通の形。地と文字だけを差し替える。 */
const ActionButton =
  "rounded border px-3 py-1.5 text-sm disabled:cursor-default disabled:opacity-50";

/**
 * ドキュメントを開く / 作る導線。
 *
 * 開いた後はメニュー（⌘O / ⌘N）へ移るので、ボタンとして出るのはこの画面だけ
 * （#374 / `src-tauri/src/menu.rs`）。
 *
 * @param actions 開く / 作るを始める手続き
 * @param disabled 既に開く操作が始まっていて、押させたくないか
 * @returns 開く（強調）と新規作成を並べた 2 つのボタン
 */
function StartActions({
  actions,
  disabled,
}: Readonly<{
  actions: DocumentSessionActions;
  disabled: boolean;
}>): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={actions.openDocument}
        disabled={disabled}
        className={`${ActionButton} border-[#0d99ff] bg-[#0d99ff] text-white hover:bg-[#0b8ae8]`}
      >
        開く
      </button>
      <button
        type="button"
        onClick={actions.createDocument}
        disabled={disabled}
        className={`${ActionButton} border-[#e6e6e6] bg-white text-[#1e1e1e] hover:bg-[#f5f5f5]`}
      >
        新規作成
      </button>
    </div>
  );
}

/**
 * 最近開いたファイルの 1 件。
 *
 * フォルダ名を添えるのは、ファイル名だけでは同名のファイルを別フォルダで開いたときに
 * 区別できないため（`EditorTopBar.Breadcrumb` と同じ理由）。フルパスは `title` に持たせる。
 *
 * 名前を持たないパス（`/` だけなど）では字を出さずに `title` だけが残る。
 * 出せない名前を綴り直す既定値を置かないのは、`EditorTopBar.Breadcrumb` と同じ扱い。
 *
 * @param path 開く先のパス
 * @param onOpen そのパスを開く手続き
 * @returns 押すとそのファイルを開くボタン
 */
function RecentFileButton({
  path,
  onOpen,
}: Readonly<{ path: string; onOpen: (path: string) => void }>): ReactElement {
  const fileName = FilePath.fileName(path);
  const folderName = FilePath.folderName(path);

  return (
    <li>
      <button
        type="button"
        title={path}
        onClick={() => onOpen(path)}
        className="flex w-full items-baseline gap-2 rounded px-2 py-1.5 text-left hover:bg-[#f0f0f0]"
      >
        {fileName.some && (
          <span className="truncate font-medium text-[#1e1e1e] text-sm">
            {fileName.value}
          </span>
        )}
        {folderName.some && (
          <span className="truncate text-[#767676] text-xs">
            {folderName.value}
          </span>
        )}
      </button>
    </li>
  );
}

/**
 * 最近開いたファイルの一覧。
 *
 * 並べ替えも重複の除去もしない。どの順で何件持つかは一覧を供給する側の決め事で、
 * 保存先が決まるまでは空のまま（#376）。
 *
 * @param paths 新しい順に並んだパス
 * @param onOpen そのパスを開く手続き
 * @returns 一覧。1 件も無ければ枠ごと出さない（見出しだけが残らないようにするため）
 */
function RecentFiles({
  paths,
  onOpen,
}: Readonly<{
  paths: readonly string[];
  onOpen: (path: string) => void;
}>): ReactNode {
  if (paths.length === 0) {
    return null;
  }

  return (
    <nav aria-label="最近使ったファイル" className="w-full">
      <h2 className="px-2 pb-1 text-[#767676] text-xs">最近使ったファイル</h2>
      <ul>
        {paths.map((path) => (
          <RecentFileButton key={path} path={path} onOpen={onOpen} />
        ))}
      </ul>
    </nav>
  );
}

/**
 * ドキュメントを開いていないときの画面。
 *
 * UI 案（`docs/Design Composer.html`）は Default / Assets / Assets · Instance / Tokens /
 * Error の 5 画面で、開く前の画面を描いていない（`open` / `recent` / `welcome` はいずれも
 * 0 件）。そのため見せ方はここで決めているが、色と字の大きさは UI 案の語彙に合わせている
 * （地 `#fafafa`、文字 `#1e1e1e` / `#767676`、境界 `#e6e6e6`、強調 `#0d99ff`）。
 *
 * @param session ドキュメントを開いていないセッション
 * @param actions 開く / 作るを始める手続き
 * @param recentPaths 最近開いたファイルのパス（新しい順）
 * @param commandFailure 開く指示を受け取れなかった経路とその理由。両方受け取れていれば `none`
 * @param renderErrors 解釈できなかったファイルのエラー一覧の描き方
 */
export function DocumentStart({
  session,
  actions,
  recentPaths,
  commandFailure,
  renderErrors,
}: Readonly<{
  session: UnopenedSession;
  actions: DocumentSessionActions;
  recentPaths: readonly string[];
  commandFailure: Option<CommandSourceFailure>;
  renderErrors: RenderDocumentErrors;
}>) {
  const isOpening = DocumentSession.isOpening(session);

  return (
    // relative は renderErrors が返すものの包含ブロック。外すと基準がビューポートへ移り、
    // 一覧の高さの上限（画面の半分）が帯のぶんだけ広がる。happy-dom は Tailwind を
    // 解決しないのでテストでは落ちず、気づけるのは視覚差分だけ。
    <section
      aria-label="ドキュメントの開始"
      className="relative flex h-full flex-col items-center justify-center bg-[#fafafa] text-[#1e1e1e]"
    >
      <div className="flex w-80 flex-col items-center gap-4 text-center">
        <h1 className="font-medium text-2xl tracking-tight">Design Composer</h1>
        <p className="text-[#767676] text-sm">
          {isOpening
            ? "ファイルを読み込んでいます…"
            : "ドキュメントを開くか、新しく作成してください。"}
        </p>
        <StartActions actions={actions} disabled={isOpening} />
        <RecentFiles paths={recentPaths} onOpen={actions.openDocumentAt} />
        <p className="rounded border border-[#e6e6e6] border-dashed px-3 py-2 text-[#767676] text-xs">
          .dcmp ファイルをウィンドウに落としても開けます
        </p>
        {commandFailure.some && (
          <FailureLine
            label={commandSourceFailureLabel(commandFailure.value.source)}
            message={commandFailure.value.message}
          />
        )}
        {session.kind === "failed" && (
          <OpenFailure failure={session.failure} renderErrors={renderErrors} />
        )}
      </div>
    </section>
  );
}

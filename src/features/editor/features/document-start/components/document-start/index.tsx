import { type ReactElement, type ReactNode, useId } from "react";
import {
  DocumentOpenFailureNotice,
  FailureLine,
  type RenderDocumentErrors,
} from "@/features/editor/features/document-start/components/document-open-failure";
import { OpenAttempt } from "@/features/editor/features/document-start/domains/document-session";
import {
  type CommandSource,
  type CommandSourceFailure,
  CommandSources,
  type DocumentSessionActions,
} from "@/features/editor/features/document-start/hooks/use-document-session";
import { FilePath } from "@/utils/FilePath";
import { Option } from "@/utils/Option";

/**
 * 開く指示を受け取れない経路を、利用者向けの言い方にする。
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

/** 開始画面のカード 1 枚の見た目。綴りと、部位ごとの配色を指定する Tailwind のクラスを持つ。 */
type CardFace = Readonly<{
  /** カードの名前になる見出し。 */
  title: string;
  /** 押すと何が起きるかの 1 行。 */
  description: string;
  /**
   * 同じ操作をメニューから呼ぶショートカットの表記。
   *
   * 割り当ての出どころは `src-tauri/src/menu.rs` の `CmdOrCtrl+O` / `CmdOrCtrl+N` で、ここは表示の綴りだけを持つ。
   * OS ごとに表記は変えず、コンテキストメニューと同じ ⌘ 表記に揃えている。
   */
  shortcut: string;
  /** アイコン（viewBox 0 0 24 24）を描く path の `d`。 */
  iconPaths: readonly string[];
  /** カードの枠・文字・地と、押せるときの hover の地を指定するクラス。 */
  cardClass: string;
  /** アイコンの地を指定するクラス。 */
  iconClass: string;
  /** 説明の文字色を指定するクラス。 */
  descriptionClass: string;
  /** ショートカットの枠・文字の色を指定するクラス。 */
  shortcutClass: string;
}>;

/**
 * 開くのカード（プライマリ）。
 *
 * 元の白文字 on `#4db2ff` は約 2.3:1 で 4.5:1 に届かなかったので、UI 案の青の組み合わせから離れた（#1062）。
 * hover 中の `#0a74c9` on `#e7f1fa` も約 4.2:1 で届かないが、押す直前の一時的な状態として受け入れている（#1062）。
 */
const OpenCardFace = {
  title: "開く",
  description: "既存の .dcmp を選ぶ",
  shortcut: "⌘O",
  iconPaths: [
    "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  ],
  cardClass:
    "border-[#0a74c9] bg-[#ffffff] text-[#0a74c9] enabled:hover:bg-[#e7f1fa]",
  iconClass: "bg-[#e7f1fa]",
  descriptionClass: "text-[#4a6a85]",
  shortcutClass: "border-[#b9d6ef] text-[#0a74c9]",
} as const satisfies CardFace;

/** 新規作成のカード。 */
const CreateCardFace = {
  title: "新規作成",
  description: "空のドキュメントから始める",
  shortcut: "⌘N",
  iconPaths: ["M12 5v14", "M5 12h14"],
  cardClass:
    "border-[#d4d4d4] bg-[#ffffff] text-[#1e1e1e] enabled:hover:bg-[#f5f5f5]",
  iconClass: "bg-[#f0f0f0]",
  descriptionClass: "text-[#767676]",
  shortcutClass: "border-[#e6e6e6] text-[#767676]",
} as const satisfies CardFace;

/**
 * アイコン・見出し・説明・ショートカットを載せた、押せるカード。
 *
 * @param face カードの綴りと配色
 * @param onClick 押したときに始める手続き
 * @param disabled 押させたくないか
 * @returns 見出しを名前に、説明とショートカットを説明に持つボタン
 */
function ActionCard({
  face,
  onClick,
  disabled,
}: Readonly<{
  face: CardFace;
  onClick: () => void;
  disabled: boolean;
}>): ReactElement {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const shortcutId = `${id}-shortcut`;

  return (
    // 名前は見出しだけにする。中身から決めさせると「新規作成 空のドキュメントから始める ⌘N」
    // になり、名前で引いている呼び出し側（「開く」「新規作成」）が見つけられなくなる。
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId} ${shortcutId}`}
      className={`flex flex-col items-start gap-[10px] rounded-[10px] border p-4 text-left focus-visible:outline-2 focus-visible:outline-[#0a74c9] focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-50 ${face.cardClass}`}
    >
      <span
        className={`flex size-8 items-center justify-center rounded-[8px] ${face.iconClass}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[18px]"
        >
          {face.iconPaths.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </span>
      <span className="flex flex-col gap-[2px]">
        <span id={titleId} className="font-medium text-[14px]">
          {face.title}
        </span>
        <span
          id={descriptionId}
          className={`text-[12px] ${face.descriptionClass}`}
        >
          {face.description}
        </span>
      </span>
      <span
        id={shortcutId}
        className={`self-end rounded-[4px] border px-[6px] py-[1px] text-[11px] ${face.shortcutClass}`}
      >
        {face.shortcut}
      </span>
    </button>
  );
}

/**
 * ドキュメントを開く / 作る導線。
 *
 * 開いた後はメニューへ移るので、ボタンとして出るのはこの画面だけ
 * （`src-tauri/src/menu.rs`）。
 *
 * @param actions 開く / 作るを始める手続き
 * @param disabled 既に開く操作が始まっていて、押させたくないか
 * @returns 開く（プライマリ）と新規作成の 2 枚のカード
 */
function StartActions({
  actions,
  disabled,
}: Readonly<{
  actions: DocumentSessionActions;
  disabled: boolean;
}>): ReactElement {
  return (
    <div className="mt-2 grid w-full grid-cols-2 gap-3">
      <ActionCard
        face={OpenCardFace}
        onClick={actions.openDocument}
        disabled={disabled}
      />
      <ActionCard
        face={CreateCardFace}
        onClick={actions.createDocument}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * 最近開いたファイルの 1 件。
 *
 * フルパスは `title` に持たせる。
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
        {Option.isSome(fileName) && (
          <span className="truncate font-medium text-[#1e1e1e] text-sm">
            {fileName.value}
          </span>
        )}
        {Option.isSome(folderName) && (
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
 * 並べ替えも重複の除去もしない。どの順で何件持つかは一覧を供給する側の決め事。
 *
 * @param paths 新しい順に並んだパス
 * @param onOpen そのパスを開く手続き
 * @returns 一覧。1 件も無ければ枠ごと出さない（見出しだけが残らないようにするため）
 */
function RecentFileList({
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
 * UI 案（`docs/Design Composer.html`）が持つ画面はどれもドキュメントを開いた後のもので、
 * 開く前の画面を描いていない（`open` / `recent` / `welcome` はいずれも 0 件）。そのため見せ
 * 方はここで決めている。画面の数と名前は `rules/ui-verification.md` が持つ。
 *
 * 開くのカードの青系の配色（`OpenCardFace`）と、2 枚に共通のフォーカス枠の青（`#0a74c9`）は
 * UI 案の語彙に無く、意図して離れている（#1062）。それ以外の色は UI 案の語彙から採っている。
 *
 * @param attempt 直近の開く操作がどこまで進んだか
 * @param actions 開く / 作るを始める手続き
 * @param recentPaths 最近開いたファイルのパス（新しい順）
 * @param recentFilesFailure その一覧を読み取れなかった理由。読めていれば `none`
 * @param commandFailure 開く指示を受け取れなかった経路とその理由。両方受け取れていれば `none`
 * @param renderErrors 解釈できなかったファイルのエラー一覧の描き方
 */
export function DocumentStart({
  attempt,
  actions,
  recentPaths,
  recentFilesFailure,
  commandFailure,
  renderErrors,
}: Readonly<{
  attempt: OpenAttempt;
  actions: DocumentSessionActions;
  recentPaths: readonly string[];
  recentFilesFailure: Option<string>;
  commandFailure: Option<CommandSourceFailure>;
  renderErrors: RenderDocumentErrors;
}>) {
  const isOpening = OpenAttempt.isOpening(attempt);
  const failure = OpenAttempt.failure(attempt);

  return (
    // relative は renderErrors が返すものの包含ブロック。外すと基準がビューポートへ移り、
    // 一覧の高さの上限（画面の半分）が帯のぶんだけ広がる。happy-dom は Tailwind を
    // 解決しないのでテストでは落ちず、気づけるのは視覚差分だけ。
    <section
      aria-label="ドキュメントの開始"
      className="relative flex h-full flex-col items-center justify-center bg-[#fafafa] text-[#1e1e1e]"
    >
      {/* 400px は 2 枚のカードの列の幅（#1062）。案内の 1 行もこの幅で折り返さない。
         中央揃えは、案内が伸びて折り返したときに整うようにしておく。*/}
      <div className="flex w-[400px] flex-col items-center gap-4 text-center">
        <h1 className="font-medium text-2xl tracking-tight">Design Composer</h1>
        <p className="text-[#767676] text-sm">
          {isOpening
            ? "ファイルを読み込んでいます…"
            : "ドキュメントを開くか、新しく作成してください。"}
        </p>
        <StartActions actions={actions} disabled={isOpening} />
        <RecentFileList
          paths={recentPaths}
          onOpen={(path) => actions.openDocumentsAt([path])}
        />
        <p className="rounded border border-[#e6e6e6] border-dashed px-3 py-2 text-[#767676] text-xs">
          .dcmp ファイルをウィンドウに落としても開けます
        </p>
        {Option.isSome(recentFilesFailure) && (
          <FailureLine
            label="最近使ったファイルを読み込めません"
            message={Option.some(recentFilesFailure.value)}
          />
        )}
        {Option.isSome(commandFailure) && (
          <FailureLine
            label={commandSourceFailureLabel(commandFailure.value.source)}
            message={Option.some(commandFailure.value.message)}
          />
        )}
        {Option.isSome(failure) && (
          <DocumentOpenFailureNotice
            failure={failure.value}
            renderErrors={renderErrors}
          />
        )}
      </div>
    </section>
  );
}

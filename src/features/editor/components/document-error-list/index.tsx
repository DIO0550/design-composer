import type { ReactElement, ReactNode } from "react";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { DocumentErrorLocation } from "@/features/editor/domains/document-error";
import type { ValueOf } from "@/types/ValueOf";

/**
 * エラーがどこの不正を指しているか（#128）と、そこで何ができるか（#136）。
 * 由来ごとに画面での意味が違うので、一覧を出す側が取り違えないよう名前で指せるようにする
 * （rules/coding.md「値の集合から union を導出する」）。
 *
 * - `unopened-file`: 開こうとしたファイルが不正で、まだ何も開けていない（開始画面）
 * - `opened-file`: 開いているファイルが不正で、映っているのは最後に正常だった表示（docs/03-schema.md）
 * - `document`: 映っているものは最新で、その中身が不正
 *
 * `unopened-file` と `opened-file` を分けているのは、**できる操作が違う**ため。
 * 開けていない側には飛び先のノードも書き戻す表示中の内容も存在しないので、
 * `Reveal` も `revert file` も渡せない（props の直和がそれを型で示す）。
 */
export const DocumentErrorOrigins = {
  UnopenedFile: "unopened-file",
  OpenedFile: "opened-file",
  Document: "document",
} as const;

/** エラーの由来。 */
export type DocumentErrorOrigin = ValueOf<typeof DocumentErrorOrigins>;

/**
 * 一覧に渡すもの。由来ごとに使える操作が変わるので、由来を判別子にした直和で受ける。
 *
 * 操作を任意の props にすると「開いていないのに書き戻す口がある」「編集中の不正を
 * ファイルへ戻す口がある」が型で作れてしまう（rules/coding.md「不正な状態を型で
 * 表現できなくする」）。
 */
export type DocumentErrorListProps = Readonly<{
  errors: readonly DocumentError[];
}> &
  (
    | Readonly<{ origin: typeof DocumentErrorOrigins.UnopenedFile }>
    | Readonly<{
        origin: typeof DocumentErrorOrigins.OpenedFile;
        onReveal: (nodeName: string) => void;
        onRevertFile: () => void;
        isReverting: boolean;
      }>
    | Readonly<{
        origin: typeof DocumentErrorOrigins.Document;
        onReveal: (nodeName: string) => void;
      }>
  );

/**
 * エラーが指す場所の表示。位置の持ち方が由来ごとに違うので、ここで読める形にする。
 *
 * @param location エラーが指している場所
 * @returns 行に出す 1 行の綴り
 */
function locationLabel(location: DocumentError["location"]): string {
  switch (location.kind) {
    case "text-position":
      return `${location.position} 文字目`;
    case "document-path":
      return location.path;
    case "node":
      return location.prop === undefined
        ? location.nodeName
        : `${location.nodeName}.${location.prop}`;
    case "whole-document":
      return "ファイル全体";
  }
}

/**
 * 由来ごとの見え方。読み上げ名・見出しの相手・置かれ方は常に対で決まるので、
 * 1 つの switch で返す（3 つに分けると由来を足すときの直し方が 3 通りになる）。
 *
 * ファイル由来は下端へ密着するので上辺だけを仕切り、ドキュメント由来は下端に積む器の
 * 中で浮くので枠を閉じて影を付ける（上辺だけだと切れ端が漂って見える）。
 * Why not: ドキュメント由来にも `absolute` を持たせ、挿入ツールバーの高さぶん上へ
 * ずらす案は採らない。ツールバーの寸法をここへ写すことになり、ずれても
 * happy-dom は Tailwind を解決しないのでテストでは気づけない（#128）。
 *
 * 開く前と開いた後のファイル由来が同じ見え方なのは、どちらも「ファイルが不正で、
 * その一覧が下端に出ている」画面だから。違うのは操作の有無だけ（#136）。
 *
 * @param origin エラーの由来
 * @returns 一覧の読み上げ名・見出しの相手・置かれ方
 */
function originPresentation(origin: DocumentErrorOrigin): Readonly<{
  listLabel: string;
  headingSubject: string;
  layout: string;
}> {
  switch (origin) {
    case DocumentErrorOrigins.UnopenedFile:
    case DocumentErrorOrigins.OpenedFile:
      return {
        listLabel: "エラー一覧",
        headingSubject: "ファイル",
        layout: "absolute inset-x-0 bottom-0 border-t",
      };
    case DocumentErrorOrigins.Document:
      return {
        listLabel: "ドキュメントのエラー一覧",
        headingSubject: "編集中のドキュメント",
        layout: "w-full rounded-lg border shadow-[0_5px_18px_rgba(0,0,0,0.18)]",
      };
  }
}

/**
 * 外部変更を捨てて、表示中の内容でファイルを上書きする操作
 * （UI 案 docs/Design Composer.html の Error 画面。見出しの右端に置かれる）。
 *
 * 綴りを UI 案の英語のまま使うのは、UI 案が名指ししている操作名だから
 * （`token-used-by` の `Used by` と同じ扱い）。
 *
 * @returns 見出しの右端に寄せる書き戻しのボタン
 */
function RevertFileButton({
  onRevertFile,
  isReverting,
}: Readonly<{ onRevertFile: () => void; isReverting: boolean }>) {
  return (
    <button
      type="button"
      onClick={onRevertFile}
      // 書き込み中に押し直させない（rules/hooks.md「連打防止は disabled が第一選択」）
      disabled={isReverting}
      className="ml-auto shrink-0 font-medium text-[#0d99ff] text-xs disabled:text-gray-400"
    >
      revert file
    </button>
  );
}

/**
 * エラーが指すノードをツリー / キャンバスで見せる操作（UI 案の Error 画面）。
 *
 * 読み上げ名にノード名を入れるのは、同じ `Reveal` が行の数だけ並ぶため。
 *
 * @returns その行のノードへ飛ぶボタン
 */
function RevealButton({
  nodeName,
  onReveal,
}: Readonly<{ nodeName: string; onReveal: (nodeName: string) => void }>) {
  return (
    <button
      type="button"
      aria-label={`${nodeName} を表示`}
      onClick={() => onReveal(nodeName)}
      className="ml-auto shrink-0 rounded border border-gray-300 bg-white px-2 py-0.5 text-gray-900 text-xs"
    >
      Reveal
    </button>
  );
}

/**
 * エラー 1 件の行。飛び先のノードを持つ行にだけ `Reveal` を出す。
 *
 * Why not: 「表示中のドキュメントに在るか」までは条件にしない。行ごとに可否を配ると
 * 「行 + 飛べるか」の対の型が要り、`errors` を渡すだけで描けるこの部品が
 * エディタの状態に依存する形へ変わる。押しても飛び先が無い行では
 * `EditorState.reveal` が `none` を返して何も起きない。
 *
 * @returns 場所・本文と、飛べるなら `Reveal` を並べた 1 行
 */
function DocumentErrorRow({
  error,
  label,
  onReveal,
}: Readonly<{
  error: DocumentError;
  label: string;
  onReveal?: (nodeName: string) => void;
}>) {
  const nodeName = DocumentErrorLocation.nodeName(error.location);
  // 飛べる先を持つ行でも、飛ばせない画面（開始画面）では出さない
  const showsReveal = nodeName.some && onReveal !== undefined;

  return (
    <li className="flex items-center gap-2">
      <span className="shrink-0 font-mono text-red-700 text-xs">{label}</span>
      <span>{error.message}</span>
      {showsReveal ? (
        <RevealButton nodeName={nodeName.value} onReveal={onReveal} />
      ) : null}
    </li>
  );
}

/**
 * エラーの並び。行の識別は並びの位置ではなく中身で行う
 * （一覧は読み込みのたびに丸ごと入れ替わる）。場所の綴りは識別にも表示にも要るので
 * ここで 1 度だけ作って渡す。
 *
 * @returns エラー 1 件ごとの行
 */
function DocumentErrorRows({
  errors,
  onReveal,
}: Readonly<{
  errors: readonly DocumentError[];
  onReveal?: (nodeName: string) => void;
}>) {
  return errors.map((error) => {
    const label = locationLabel(error.location);
    return (
      <DocumentErrorRow
        key={`${error.kind}:${label}:${error.message}`}
        error={error}
        label={label}
        onReveal={onReveal}
      />
    );
  });
}

/**
 * 一覧の器。読み上げ名・見出し・置かれ方は由来で決まり、由来で変わるのは
 * 見出しの飾りと行から飛べるかだけなので、器をここに 1 つだけ持つ。
 *
 * 件数を受け取らず `errors` から数えるのは、見出しの件数と並んだ行数が
 * 食い違う状態を作れないようにするため。
 *
 * @returns エラーの件数を見出しに持つ器と、その中の行
 */
function ErrorSection({
  origin,
  errors,
  headingExtra,
  onReveal,
}: Readonly<{
  origin: DocumentErrorOrigin;
  errors: readonly DocumentError[];
  headingExtra: ReactNode;
  onReveal?: (nodeName: string) => void;
}>) {
  const presentation = originPresentation(origin);

  return (
    <section
      // 画面が失われたと誤解されないよう、支援技術にも「表示は保たれたまま
      // エラーが出ている」ことを伝える。
      role="alert"
      aria-label={presentation.listLabel}
      className={`${presentation.layout} max-h-1/2 overflow-auto border-red-300 bg-red-50/95 p-3 text-red-900 text-sm`}
    >
      <h2 className="mb-2 flex items-center gap-2 font-semibold">
        <span>
          {presentation.headingSubject}に {errors.length} 件のエラー
        </span>
        {headingExtra}
      </h2>
      <ul className="flex flex-col gap-1">
        <DocumentErrorRows errors={errors} onReveal={onReveal} />
      </ul>
    </section>
  );
}

/**
 * エラーを 1 件ずつ並べる一覧（docs/03-schema.md「不正ファイル時の挙動」）。
 * 0 件なら何も出さない。由来ごとの見え方は `originPresentation` が持つ。
 *
 * キャンバスを覆い切らないのは、エラーの原因になった箇所の周辺を見ながら直せるようにするため。
 *
 * 戻り値を `ReactElement | null` と書いているのは、由来を足したときに
 * 返さない経路をコンパイルエラーにするため（`ReactNode` は `undefined` を含む）。
 *
 * @returns 由来に応じた操作つきのエラー一覧。エラーが 0 件なら `null`
 */
/**
 * 由来ごとに変わるのは「見出しに何を足すか」と「行から飛ばせるか」の 2 つだけ。
 * ここでその 2 つに畳んでから、器と行は 1 組だけ組む。
 *
 * `switch` を `default` 無しで書き、戻り値をオブジェクト型にしているので、
 * 由来を足すと返さない経路がコンパイルエラーになる（`rules/coding.md`）。
 *
 * @param props 一覧に渡されたもの
 * @returns 見出しに足すものと、行の飛び先を開く手段（飛ばせないなら未指定）
 */
function originOperations(props: DocumentErrorListProps): Readonly<{
  headingExtra: ReactNode;
  onReveal?: (nodeName: string) => void;
}> {
  switch (props.origin) {
    case DocumentErrorOrigins.UnopenedFile:
      return { headingExtra: null };
    case DocumentErrorOrigins.OpenedFile:
      return {
        headingExtra: (
          <RevertFileButton
            onRevertFile={props.onRevertFile}
            isReverting={props.isReverting}
          />
        ),
        onReveal: props.onReveal,
      };
    case DocumentErrorOrigins.Document:
      return { headingExtra: null, onReveal: props.onReveal };
  }
}

/**
 * エラーを 1 件ずつ並べる一覧（docs/03-schema.md「不正ファイル時の挙動」）。
 * 0 件なら何も出さない。由来ごとの見え方は `originPresentation` が持つ。
 *
 * キャンバスを覆い切らないのは、エラーの原因になった箇所の周辺を見ながら直せるようにするため。
 *
 * @returns 由来に応じた操作つきのエラー一覧。エラーが 0 件なら `null`
 */
export function DocumentErrorList(
  props: DocumentErrorListProps,
): ReactElement | null {
  if (props.errors.length === 0) {
    return null;
  }

  const operations = originOperations(props);

  return (
    <ErrorSection
      origin={props.origin}
      errors={props.errors}
      headingExtra={operations.headingExtra}
      onReveal={operations.onReveal}
    />
  );
}

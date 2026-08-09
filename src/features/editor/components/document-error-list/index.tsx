import type {
  DocumentError,
  DocumentErrorLocation,
} from "@/features/editor/domains/document-error";
import type { ValueOf } from "@/types/ValueOf";

/**
 * エラーがどこの不正を指しているか（#128）。由来ごとに画面での意味が違うので、
 * 一覧を出す側が取り違えないよう名前で指せるようにする
 * （rules/coding.md「値の集合から union を導出する」）。
 *
 * - `file`: ファイルが不正で、映っているのは最後に正常だった表示（docs/03-schema.md）
 * - `document`: 映っているものは最新で、その中身が不正
 */
export const DOCUMENT_ERROR_ORIGINS = {
  file: "file",
  document: "document",
} as const;

export type DocumentErrorOrigin = ValueOf<typeof DOCUMENT_ERROR_ORIGINS>;

/** エラーが指す場所の表示。位置の持ち方が由来ごとに違うので、ここで読める形にする。 */
function locationLabel(location: DocumentErrorLocation): string {
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
 * 一覧の見出し。何が不正なのかは由来でしか分からないので、件数だけでなく相手も出す。
 *
 * 戻り値を素の `string` にしているのは、case を足し忘れると「返さない経路がある」で
 * コンパイルエラーになるため（rules/coding.md「列挙した状態の網羅を型で強制する」）。
 */
function headingLabel(origin: DocumentErrorOrigin, count: number): string {
  switch (origin) {
    case DOCUMENT_ERROR_ORIGINS.file:
      return `ファイルに ${count} 件のエラー`;
    case DOCUMENT_ERROR_ORIGINS.document:
      return `編集中のドキュメントに ${count} 件のエラー`;
  }
}

/** 支援技術から 2 つの一覧を区別できるようにする読み上げ名。 */
function listLabel(origin: DocumentErrorOrigin): string {
  switch (origin) {
    case DOCUMENT_ERROR_ORIGINS.file:
      return "エラー一覧";
    case DOCUMENT_ERROR_ORIGINS.document:
      return "ドキュメントのエラー一覧";
  }
}

/**
 * ファイル由来は下端へ密着させるので上辺だけを仕切る。ドキュメント由来は下端に積む器の
 * 中で浮くため、枠を閉じて影を付ける（上辺だけだと切れ端が漂って見える）。
 *
 * Why not: ドキュメント由来にも `absolute` を持たせ、挿入ツールバーの高さぶん
 * 上へずらす案は採らない。ツールバーの寸法をここへ写すことになり、ずれても
 * happy-dom は Tailwind を解決しないのでテストでは気づけない（#128）。
 */
const ORIGIN_LAYOUTS = {
  file: "absolute inset-x-0 bottom-0 border-t",
  document: "w-full rounded-lg border shadow-[0_5px_18px_rgba(0,0,0,0.18)]",
} as const satisfies Readonly<Record<DocumentErrorOrigin, string>>;

/**
 * ドキュメントの不正を並べる一覧（docs/03-schema.md「不正ファイル時の挙動」）。
 *
 * 最後に正常だった状態のレンダリングへ重ねるため、下からせり出す形で置く。
 * キャンバスを覆い切らないのは、エラーの原因になった編集の周辺を見ながら
 * 外部エディタで直せるようにするため。
 */
export function DocumentErrorList({
  errors,
  origin,
}: Readonly<{
  errors: readonly DocumentError[];
  origin: DocumentErrorOrigin;
}>) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <section
      // 画面が失われたと誤解されないよう、支援技術にも「表示は保たれたまま
      // エラーが出ている」ことを伝える。
      role="alert"
      aria-label={listLabel(origin)}
      className={`${ORIGIN_LAYOUTS[origin]} max-h-1/2 overflow-auto border-red-300 bg-red-50/95 p-3 text-red-900 text-sm`}
    >
      <h2 className="mb-2 font-semibold">
        {headingLabel(origin, errors.length)}
      </h2>
      <ul className="flex flex-col gap-1">
        {errors.map((error) => {
          const location = locationLabel(error.location);
          return (
            // 一覧は読み込みのたびに丸ごと入れ替わるので、並びの位置ではなく中身で識別する。
            <li
              key={`${error.kind}:${location}:${error.message}`}
              className="flex gap-2"
            >
              <span className="shrink-0 font-mono text-red-700 text-xs">
                {location}
              </span>
              <span>{error.message}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

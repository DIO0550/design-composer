import type {
  DocumentError,
  DocumentErrorLocation,
} from "@/features/editor/domains/document-error";

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
 * 不正なファイルのエラー一覧（docs/03-schema.md「不正ファイル時の挙動」）。
 *
 * 最後に正常だった状態のレンダリングへ重ねるため、下からせり出す形で置く。
 * キャンバスを覆い切らないのは、エラーの原因になった編集の周辺を見ながら
 * 外部エディタで直せるようにするため。
 */
export function DocumentErrorList({
  errors,
}: Readonly<{ errors: readonly DocumentError[] }>) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <section
      // 画面が失われたと誤解されないよう、支援技術にも「表示は保たれたまま
      // エラーが出ている」ことを伝える。
      role="alert"
      aria-label="エラー一覧"
      className="absolute inset-x-0 bottom-0 max-h-1/2 overflow-auto border-red-300 border-t bg-red-50/95 p-3 text-red-900 text-sm"
    >
      <h2 className="mb-2 font-semibold">{errors.length} 件のエラー</h2>
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

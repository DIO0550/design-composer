import type { ReactElement, ReactNode } from "react";
import { CanvasView } from "@/features/editor/domains/canvas-view";
import type { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import { OpenedDocument } from "@/features/editor/domains/opened-document";

/**
 * 画面上部の帯（UI 案 docs/Design Composer.html の Default 画面。高さ 38px）。
 *
 * ランドマークを与えないのは、`DocumentToolbar` が既に `<header>`（banner）を出しており、
 * ここも `<header>` にすると banner が 2 つ並ぶため。中身はそれぞれが自分の役割を
 * 名乗る（パンくずは `nav`、倍率は `toolbar`）。
 *
 * UI 案は左端に macOS の信号機ボタンを描いているが、置いていない。
 * Why not: `src-tauri/tauri.conf.json` は `decorations` を指定しておらず既定（OS が
 * ウィンドウ装飾を描く）なので、装飾が二重になり、押しても閉じない偽の閉じるボタンが並ぶ。
 */
function DocumentTopBarRoot({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex h-[38px] shrink-0 items-center gap-3 border-gray-300 border-b bg-white px-3 text-gray-900 text-xs">
      {children}
    </div>
  );
}

/**
 * 開いているファイルの居場所（UI 案の `settings-ui / app.dcmp`）。
 *
 * 親フォルダを持たないパス（相対パスのファイル名だけ・ルート直下）では区切りごと出さない。
 * 綴り（`/` で繋ぐ・ファイル名を強調する）はここが持ち、ドメインは名前だけを答える
 * （rules/architecture.md「表示のための綴りをドメインへ持ち込まない」）。
 *
 * フルパスを `title` に持たせるのは、末尾 2 つだけでは同名のファイルを別フォルダで
 * 開いたときに区別できないため。
 */
function DocumentBreadcrumb({
  opened,
}: Readonly<{ opened: OpenedDocument }>): ReactElement {
  const folderName = OpenedDocument.folderName(opened);
  const fileName = OpenedDocument.fileName(opened);

  return (
    <nav aria-label="ファイルの場所" title={opened.path}>
      {folderName.some ? (
        <>
          <span className="text-gray-500">{folderName.value}</span>
          <span className="px-1.5 text-gray-300">/</span>
        </>
      ) : null}
      {fileName.some ? (
        <span className="font-medium">{fileName.value}</span>
      ) : null}
    </nav>
  );
}

/** 保存状態ごとの、バッジの字面と色。 */
const SAVE_BADGE_FACES = {
  saved: { label: "保存済み", className: "bg-green-50 text-green-700" },
  saving: { label: "保存中", className: "bg-gray-100 text-gray-600" },
  failed: { label: "保存に失敗", className: "bg-red-50 text-red-700" },
} as const satisfies Readonly<
  Record<
    DocumentSaveState["kind"],
    Readonly<{ label: string; className: string }>
  >
>;

/**
 * 画面のドキュメントがファイルに載っているか（UI 案の `● saved`）。
 *
 * UI 案が描いているのは `saved`（緑）と、Error 画面の赤いバッジの 2 つ。
 * 書き出し待ちの `保存中` だけが案に無いが、固定の字面にすると書き込みが失敗している間も
 * 「保存済み」と名乗ることになるため、状態をそのまま出す。
 *
 * 出し分けを `switch` で書き戻り値を `ReactElement` にしているのは、状態を 1 つ足したときに
 * コンパイルエラーにするため（rules/coding.md「列挙した状態の網羅を型で強制する」）。
 */
function DocumentSaveBadge({
  state,
}: Readonly<{ state: DocumentSaveState }>): ReactElement {
  const face = SAVE_BADGE_FACES[state.kind];
  return (
    <p
      className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 ${face.className}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {face.label}
    </p>
  );
}

/** 帯の中でのボタンの形。倍率とその両隣で同じ大きさに揃える。 */
const ZOOM_BUTTON = "rounded px-1.5 py-0.5 text-gray-600 hover:bg-gray-100";

/**
 * 倍率の操作（UI 案の `− 55% +`）。右端へ寄るのはこの並び自身の性質なので `ml-auto` を持つ。
 *
 * 倍率の表示そのものを等倍へ戻すボタンにしている。
 * Why not: `等倍に戻す` のボタンを 4 つ目として並べない。UI 案の帯は 3 つしか描いておらず、
 * 描かれていない操作は既存の流儀へ寄せる（rules/ui-verification.md）。
 */
function DocumentZoom({
  view,
  onZoomIn,
  onZoomOut,
  onReset,
}: Readonly<{
  view: CanvasView;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}>): ReactElement {
  return (
    <div
      role="toolbar"
      aria-label="表示倍率"
      className="ml-auto flex items-center gap-0.5"
    >
      <button
        type="button"
        aria-label="縮小"
        onClick={onZoomOut}
        className={ZOOM_BUTTON}
      >
        −
      </button>
      <button
        type="button"
        aria-label="等倍に戻す"
        onClick={onReset}
        className="min-w-11 rounded px-1 py-0.5 text-center tabular-nums hover:bg-gray-100"
      >
        {`${CanvasView.scalePercent(view)}%`}
      </button>
      <button
        type="button"
        aria-label="拡大"
        onClick={onZoomIn}
        className={ZOOM_BUTTON}
      >
        +
      </button>
    </div>
  );
}

/** 上部バー。中身は呼び出し側が children で組む。 */
export const DocumentTopBar = Object.assign(DocumentTopBarRoot, {
  Breadcrumb: DocumentBreadcrumb,
  SaveBadge: DocumentSaveBadge,
  Zoom: DocumentZoom,
});

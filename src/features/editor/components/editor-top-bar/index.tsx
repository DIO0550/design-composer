import type { ReactElement, ReactNode } from "react";
import { CanvasView } from "@/features/editor/domains/canvas-view";
import type { DocumentError } from "@/features/editor/domains/document-error";
import type { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import { OpenedDocument } from "@/features/editor/domains/opened-document";
import type { ValueOf } from "@/types/ValueOf";

/**
 * 帯全体の色味。ファイルが不正な間は帯ごと赤へ振れる（UI 案 docs/Design Composer.html の
 * Error 画面は帯の地を `#fff6f6`、下線を `#f5d5d5`、パンくずまで赤系にする / #135）。
 *
 * 名前で指せるようにするのは、消費側が `"error"` を綴り直さずに済ませるため
 * （rules/coding.md「値の集合から union を導出する」）。
 */
export const EDITOR_TOP_BAR_TONES = {
  normal: "normal",
  error: "error",
} as const;

/** 帯の色味。 */
export type EditorTopBarTone = ValueOf<typeof EDITOR_TOP_BAR_TONES>;

/** 色味ごとの、帯の地と下線と文字。 */
const ROOT_TONE_CLASS = {
  normal: "border-gray-300 bg-white text-gray-900",
  error: "border-red-200 bg-red-50 text-red-900",
} as const satisfies Readonly<Record<EditorTopBarTone, string>>;

/**
 * 色味ごとの、パンくずの 3 つの部品の色。
 *
 * 帯とパンくずは同じ色味から決まるので、呼び出し側は**同じ値**を両方へ渡すこと
 * （帯だけ赤くしてパンくずが灰色のまま、という組み合わせを作らない）。
 * Why not: Context で暗黙に配る案は採らない。両者は 1 階層しか離れておらず、
 * `rules/components.md` は「まずは props / Composition で十分かを確認する」としている。
 */
const BREADCRUMB_TONE_FACES = {
  normal: {
    folder: "text-gray-500",
    separator: "text-gray-300",
    file: "text-gray-900",
  },
  error: {
    folder: "text-red-400",
    separator: "text-red-200",
    file: "text-red-600",
  },
} as const satisfies Readonly<
  Record<
    EditorTopBarTone,
    Readonly<{ folder: string; separator: string; file: string }>
  >
>;

/**
 * 編集画面の上端の帯（UI 案 docs/Design Composer.html の Default 画面。高さ 38px）。
 *
 * `Document*` ではなく `Editor*` なのは、並ぶものがドキュメントの話に閉じないため。
 * パンくずと保存状態は開いているドキュメントの話だが、倍率はキャンバスの見え方
 * （非永続の view state）で、ドキュメントには保存しない。3 ペインの外側にある
 * 編集画面の器という点で `EditorLayout` / `EditorScreen` と同じ並び。
 *
 * ランドマークを与えないのは、`DocumentToolbar` が既に `<header>`（banner）を出しており、
 * ここも `<header>` にすると banner が 2 つ並ぶため。中身はそれぞれが自分の役割を
 * 名乗る（パンくずは `nav`、倍率は `toolbar`）。
 *
 * UI 案は左端に macOS の信号機ボタンを描いているが、置いていない。
 * Why not: `src-tauri/tauri.conf.json` は `decorations` を指定しておらず既定（OS が
 * ウィンドウ装飾を描く）なので、装飾が二重になり、押しても閉じない偽の閉じるボタンが並ぶ。
 *
 * 高さ（`h-[38px]`）を落としても中身の分だけ縮むだけでテストは 1 件も落ちない。
 * 気づく手段は Storybook の視覚差分だけ。
 */
function EditorTopBarRoot({
  tone,
  children,
}: Readonly<{ tone: EditorTopBarTone; children: ReactNode }>) {
  return (
    <div
      className={`flex h-[38px] shrink-0 items-center gap-3 border-b px-3 text-xs ${ROOT_TONE_CLASS[tone]}`}
    >
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
 *
 * @returns 親フォルダ名（あれば）と区切り、ファイル名を並べたパンくず
 */
function DocumentBreadcrumb({
  opened,
  tone,
}: Readonly<{ opened: OpenedDocument; tone: EditorTopBarTone }>): ReactElement {
  const folderName = OpenedDocument.folderName(opened);
  const fileName = OpenedDocument.fileName(opened);
  const face = BREADCRUMB_TONE_FACES[tone];

  return (
    <nav aria-label="ファイルの場所" title={opened.path}>
      {folderName.some ? (
        <>
          <span className={face.folder}>{folderName.value}</span>
          <span className={`px-1.5 ${face.separator}`}>/</span>
        </>
      ) : null}
      {fileName.some ? (
        <span className={`font-medium ${face.file}`}>{fileName.value}</span>
      ) : null}
    </nav>
  );
}

/**
 * 保存状態ごとの、バッジの字面と色。
 *
 * `satisfies Record<DocumentSaveState["kind"], …>` が網羅を強制する（状態を 1 つ足すと
 * ここがコンパイルエラーになる）。`rules/coding.md`「状態をキーにした対応表は網羅のためだけに
 * 選ばない」に触れるが、ここが持つのは props 一式を受ける関数ではなく**字面と色の 2 つ**で、
 * `switch` で書くと同じマークアップが 3 回並ぶだけになるため対応表にしている。
 */
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
 * UI 案が保存状態として描いているのは `saved`（緑）だけ。書き出し待ちの `保存中` と
 * `保存に失敗` は案に無いが、`saved` 固定にすると書き込みが失敗している間も
 * 「保存済み」と名乗ることになるため、状態をそのまま出す
 * （Error 画面の赤いバッジは `2 errors · file invalid` で、保存状態ではなくエラー件数）。
 *
 * @returns 保存状態に応じた字面と色のバッジ
 */
function DocumentSaveBadge({
  state,
}: Readonly<{ state: DocumentSaveState }>): ReactElement {
  const face = SAVE_BADGE_FACES[state.kind];
  return (
    <p
      className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 ${face.className}`}
    >
      {/*
        UI 案の `●`。読み上げからは外れるので、消してもテストは 1 件も落ちない。
        気づく手段は Storybook の視覚差分だけ。
      */}
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {face.label}
    </p>
  );
}

/**
 * ファイルが不正な間、保存状態の代わりに出るもの（UI 案の `● 2 errors · file invalid`）。
 *
 * 保存状態と入れ替えるのは、ファイルが不正な間に「保存済み」と名乗ると、映っている
 * ものがファイルに載っていると読めてしまうため（映っているのは最後に正常だった
 * 表示で、ファイルの現在の中身とは違う / #135）。
 *
 * @param errors ファイルを取り込めなかった理由。件数だけを出す（中身はキャンバス下端の一覧が出す）
 * @returns エラーの件数とファイルが不正であることを示すバッジ
 */
function FileInvalidBadge({
  errors,
}: Readonly<{ errors: readonly DocumentError[] }>): ReactElement {
  return (
    <p className="flex items-center gap-1.5 rounded bg-red-100 px-1.5 py-0.5 text-red-700">
      {/* 保存状態のバッジと同じ `●`。読み上げからは外れる。 */}
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {`${errors.length} 件のエラー · ファイルが不正`}
    </p>
  );
}

/** 倍率の両隣（`−` / `+`）のボタンの形。中央の倍率はこれより横に広いので別に持つ。 */
const ZOOM_STEP_BUTTON =
  "rounded px-1.5 py-0.5 text-gray-600 hover:bg-gray-100";

/**
 * 倍率の操作（UI 案の `− 55% +`）。右端へ寄るのはこの並び自身の性質なので `ml-auto` を持つ
 * （外すとパンくずの隣へ寄るが、テストは 1 件も落ちない。気づく手段は Storybook の視覚差分だけ）。
 *
 * 倍率の表示そのものを等倍へ戻すボタンにしている。
 * Why not: `等倍に戻す` のボタンを 4 つ目として並べない。UI 案の倍率の並びは
 * `−` / 倍率 / `+` の 3 つしか描いておらず、描かれていない操作は既存の流儀へ寄せる
 * （rules/ui-verification.md）。
 *
 * @returns 縮小・倍率表示（クリックで等倍に戻す）・拡大を並べた操作列
 */
function CanvasZoom({
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
        className={ZOOM_STEP_BUTTON}
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
        className={ZOOM_STEP_BUTTON}
      >
        +
      </button>
    </div>
  );
}

/** 上部バー。中身は呼び出し側が children で組む。 */
export const EditorTopBar = Object.assign(EditorTopBarRoot, {
  Breadcrumb: DocumentBreadcrumb,
  SaveBadge: DocumentSaveBadge,
  FileInvalidBadge,
  Zoom: CanvasZoom,
});

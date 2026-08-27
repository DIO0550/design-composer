import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
} from "react";
import type { DocumentError } from "@/domains/session/document-error";
import type { DocumentSaveState } from "@/domains/session/document-save-state";
import { OpenedDocument } from "@/domains/session/opened-document";
import type { Elapsed, ElapsedUnit } from "@/domains/unit/elapsed";
import { CanvasView } from "@/features/canvas";
import type { ValueOf } from "@/types/ValueOf";
import { Option } from "@/utils/Option";

/**
 * 帯全体の色味。ファイルが不正な間は帯ごと赤へ振れる（UI 案 docs/Design Composer.html の
 * Error 画面は帯の地を `#fff6f6`、下線を `#f5d5d5`、パンくずまで赤系にする / #135）。
 *
 * 名前で指せるようにするのは、消費側が `"Error"` を綴り直さずに済ませるため
 * （rules/coding.md「値の集合から union を導出する」）。
 */
export const EditorTopBarTones = {
  Normal: "Normal",
  Error: "Error",
} as const;

/** 帯の色味。 */
export type EditorTopBarTone = ValueOf<typeof EditorTopBarTones>;

/** 色味ごとの、帯の地と下線と文字。 */
const RootToneClass = {
  Normal: "border-gray-300 bg-white text-gray-900",
  Error: "border-red-200 bg-red-50 text-red-900",
} as const satisfies Readonly<Record<EditorTopBarTone, string>>;

/** 色味ごとの、パンくずの 3 つの部品の色。 */
const BreadcrumbToneFaces = {
  Normal: {
    folder: "text-gray-500",
    separator: "text-gray-300",
    file: "text-gray-900",
  },
  Error: {
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

const EditorTopBarToneContext = createContext<Option<EditorTopBarTone>>(
  Option.none,
);

/**
 * 帯が配っている色味。
 *
 * 帯とパンくずは同じ色味から決まるので、**入口を 1 つにして食い違いを書けなくする**
 * （props で 2 箇所へ渡す形にすると「帯だけ赤い」組み合わせが作れてしまい、
 * それを禁じるのはコメント＝規律になる / rules/coding.md「前提をコメントで書くのは、
 * 型で閉じたことにならない」）。親が暗黙のスタイルを配り子が使う形なので
 * `rules/components.md` のコンパウンドコンポーネントに当たる。
 *
 * @returns 囲っている `EditorTopBar` の色味
 * @throws `EditorTopBar` の外で呼ばれたとき（配置ミスなので隠さずに落とす）
 */
function useEditorTopBarTone(): EditorTopBarTone {
  const tone = useContext(EditorTopBarToneContext);
  if (!tone.some) {
    throw new Error(
      "EditorTopBar.Breadcrumb は EditorTopBar の内側でのみ使える",
    );
  }
  return tone.value;
}

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
    <EditorTopBarToneContext value={Option.some(tone)}>
      <div
        className={`flex h-[38px] shrink-0 items-center gap-3 border-b px-3 text-xs ${RootToneClass[tone]}`}
      >
        {children}
      </div>
    </EditorTopBarToneContext>
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
}: Readonly<{ opened: OpenedDocument }>): ReactElement {
  const folderName = OpenedDocument.folderName(opened);
  const fileName = OpenedDocument.fileName(opened);
  const face = BreadcrumbToneFaces[useEditorTopBarTone()];

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
 * 帯に座るバッジの枠（UI 案はどちらの状態も `●` + 短い一言）。保存状態とファイルの不正は
 * 入れ替わりで同じ場所に出るので、形は 1 つにして字面と色だけを差し替える。
 *
 * @param className 状態ごとの地と文字の色
 * @returns `●` の点と、渡された字面を並べたバッジ
 */
function TopBarBadge({
  className,
  children,
}: Readonly<{ className: string; children: ReactNode }>): ReactElement {
  return (
    <p
      className={`flex items-center gap-1.5 rounded px-1.5 py-0.5 ${className}`}
    >
      {/*
        UI 案の `●`。読み上げからは外れるので、消してもテストは 1 件も落ちない。
        気づく手段は Storybook の視覚差分だけ。
      */}
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {children}
    </p>
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
const SaveBadgeFaces = {
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
  const face = SaveBadgeFaces[state.kind];
  return <TopBarBadge className={face.className}>{face.label}</TopBarBadge>;
}

/**
 * ファイルが不正な間、保存状態の代わりに出るもの（UI 案の `● 2 errors · file invalid`）。
 *
 * 保存状態と入れ替えるのは、ファイルが不正な間に「保存済み」と名乗ると、映っている
 * ものがファイルに載っていると読めてしまうため（映っているのは最後に正常だった
 * 表示で、ファイルの現在の中身とは違う / #135）。
 *
 * Why not: 「凍結中なら必ず 1 件以上」を型で縛る（`Option<非空の一覧>` を受ける）形は
 * 採らない。同じ判断が `DocumentReload` で既に済んでおり、そこでの理由（起こらない
 * 空配列の分岐を書く羽目になる）はここでも変わらないため。
 *
 * @param errors ファイルを取り込めなかった理由。件数だけを出す（中身はキャンバス下端の一覧が出す）
 * @returns エラーの件数とファイルが不正であることを示すバッジ
 */
function FileInvalidBadge({
  errors,
}: Readonly<{ errors: readonly DocumentError[] }>): ReactElement {
  return (
    <TopBarBadge className="bg-red-100 text-red-700">
      {`${errors.length} 件のエラー · ファイルが不正`}
    </TopBarBadge>
  );
}

/** 倍率の両隣（`−` / `+`）のボタンの形。中央の倍率はこれより横に広いので別に持つ。 */
const ZoomStepButton = "rounded px-1.5 py-0.5 text-gray-600 hover:bg-gray-100";

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
        className={ZoomStepButton}
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
        className={ZoomStepButton}
      >
        +
      </button>
    </div>
  );
}

/**
 * 経過時間の単位ごとの、数の後ろに付ける綴り。
 *
 * `satisfies Record<ElapsedUnit, string>` が網羅を強制する（単位を 1 つ足すと
 * ここがコンパイルエラーになる）。
 */
const ElapsedUnitSuffixes = {
  seconds: "s",
  minutes: "m",
  hours: "h",
} as const satisfies Readonly<Record<ElapsedUnit, string>>;

/**
 * 今映っているのが最後に正常だった表示で、それがどれだけ古いか
 * （UI 案 docs/Design Composer.html の Error 画面の `showing last valid render · 4s ago`）。
 *
 * 単位の綴り（`s` / `m` / `h`）と `ago` をここが持つのは、ドメイン（`Elapsed`）が持つのが
 * 単位と数までだから（rules/architecture.md「表示のための綴りをドメインへ持ち込まない」）。
 *
 * `ml-auto` を持たないのは、右端へ寄せる役目を隣の `CanvasZoom` が既に持っているため。
 * 2 つ置くと余白が 2 つの auto マージンへ等分され、`CanvasZoom` が帯の中ほどへ落ちる
 * （**テストでは落ちない** — happy-dom は Tailwind を解決しない。気づく手段は視覚差分だけ）。
 *
 * @returns 最後に正常だった表示からの経過時間を添えた 1 行
 */
function LastValidRender({
  elapsed,
}: Readonly<{ elapsed: Elapsed }>): ReactElement {
  const suffix = ElapsedUnitSuffixes[elapsed.unit];
  return (
    <p className="text-[#b58080] text-[11px]">
      {`showing last valid render · ${elapsed.count}${suffix} ago`}
    </p>
  );
}

/** 上部バー。中身は呼び出し側が children で組む。 */
export const EditorTopBar = Object.assign(EditorTopBarRoot, {
  Breadcrumb: DocumentBreadcrumb,
  SaveBadge: DocumentSaveBadge,
  FileInvalidBadge,
  Zoom: CanvasZoom,
  LastValidRender,
});

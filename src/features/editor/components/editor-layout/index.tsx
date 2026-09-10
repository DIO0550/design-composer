import type { ReactNode } from "react";
import type { NodeDragHandlers } from "@/features/canvas";

type PaneProps = Readonly<{ children: ReactNode }>;

/**
 * ファイルが不正な間、映っているものはファイルの現在の中身ではない（#135）。
 * 左右のペインはその表示を凍結したことを見た目で示す。
 */
type FreezablePaneProps = PaneProps & Readonly<{ isFrozen: boolean }>;

/**
 * 凍結中のペインの見え方（UI 案 docs/Design Composer.html の Error 画面はパネルと右ペインが `opacity:0.45` +
 * `filter:saturate(0.4)`）。彩度も落とすのは、色が付いているものだけが凍結中も普段どおりの強さで目に入るのを避けるため。
 *
 * UI 案でアイコンレールだけは `saturate` を持たないが、実装ではレールを含む `<aside>` へまとめて掛けている。レールは白地に灰色の
 * 図形しか持たず、彩度を落としても見た目が変わらないため。
 *
 * **この class を落としても凍結の判定は動いたままで、テストは 1 件も落ちない。** 気づく手段は
 * `OpenedDocumentEditor / ファイルが不正になった編集画面` の視覚差分だけ（#344 で実測 0.0031。閾値 0.002 に対して 1.5 倍しか余裕が
 * 無い）。`EditorLayout / 凍結した3ペイン` は数えない（中身が白地の文字だけで差が 0.0004 にしかならない / #346）。
 */
const FrozenPaneClass = "opacity-45 saturate-[0.4]";

/**
 * 3 ペインの器（docs/06-ui.md「画面構成」）。中身は children で受け取り、どのペインに何を出すかは呼び出し側が決める（真偽値 props
 * による出し分けを作らない / rules/components.md）。
 *
 * 高さは画面ではなく親に合わせる。ファイル操作のツールバーと同期の失敗表示が上に並ぶため、画面の高さを取ると 3 ペインがその分
 * はみ出す。
 *
 * 運んでいる間のポインタをここで受けるのは、掴む場所（左ペインのパレット）と落とす場所（キャンバス）がこの器の別の枝にあるため。
 * キャンバスの中だけで受けると、パレットで掴んで左ペインの上で離したときに `pointerup` が届かず、掴んだまま戻らなくなる。
 */
function EditorLayoutRoot({
  dragHandlers,
  children,
}: PaneProps & Readonly<{ dragHandlers: NodeDragHandlers }>) {
  return (
    <div
      {...dragHandlers}
      className="grid h-full min-h-0 w-full grid-cols-[19rem_1fr_18rem] overflow-hidden bg-gray-100 text-gray-900"
    >
      {children}
    </div>
  );
}

/**
 * 左ペイン（UI 案 docs/Design Composer.html は 56px のレールと 248px のパネルを横に並べる。あわせて 19rem / #129）。
 *
 * 器はスクロールを持たず、中身（パネル）が自分でスクロールする（ここで受けると常に見えている必要のあるレールまで一緒に流れる）。
 *
 * 凍結中に `inert` を付けるのは、UI 案がレールもパネルも淡色にして行き先の切り替えまで止めているため。**happy-dom が強制するのは
 * フォーカスまでで、click は届く**ので、押せないこと自体はブラウザでしか確かめられない。
 */
function LeftPane({ isFrozen, children }: FreezablePaneProps) {
  return (
    <aside
      aria-label="左ペイン"
      inert={isFrozen}
      className={`flex overflow-hidden border-r border-gray-300 bg-white ${
        isFrozen ? FrozenPaneClass : ""
      }`}
    >
      {children}
    </aside>
  );
}

/** 中央ペイン。キャンバスと、その下端へ重ねるものを載せる。 */
function CenterPane({ children }: PaneProps) {
  return (
    // キャンバスは自前でズーム / パンを持つため、ペイン側でスクロールさせない
    // （二重にスクロールすると、掴んで動かした位置と表示がずれる）。
    // relative は下端へ重ねるものの基準（エラー一覧とキャンバスのツールバー）。外すと
    // 両方が遠い祖先に対して浮くが、テストでは落ちない（Storybook の視覚差分だけが気づく）。
    <main
      aria-label="キャンバス"
      className="relative overflow-hidden bg-gray-100"
    >
      {children}
    </main>
  );
}

/**
 * 右ペイン（UI 案 docs/Design Composer.html のインスペクタ。264px）。
 *
 * 器はスクロールも余白も持たず、見出しの帯（`PaneHeading`）と本文（`PaneBody`）がそれぞれ内側に持つ（帯の下線をペインの両端まで
 * 届かせるため。左ペインと同じ形）。
 *
 * 凍結中に淡色だけで `inert` を付けないのは、そのとき本文が「選択は凍結中」に差し替わっていて、押せるものが 1 つも残らないため
 * （左ペインはツリーをそのまま描き続けるので `inert` が要る）。
 */
function RightPane({ isFrozen, children }: FreezablePaneProps) {
  return (
    <aside
      aria-label="プロパティパネル"
      className={`flex min-h-0 flex-col overflow-hidden border-l border-gray-300 bg-white ${
        isFrozen ? FrozenPaneClass : ""
      }`}
    >
      {children}
    </aside>
  );
}

/** 3 ペインの器。中身は呼び出し側が children で組む。 */
export const EditorLayout = Object.assign(EditorLayoutRoot, {
  LeftPane,
  CenterPane,
  RightPane,
});

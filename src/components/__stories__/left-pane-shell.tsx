import type { ReactElement, ReactNode } from "react";

/**
 * 左ペインのパネル部の幅。編集画面のグリッド（`EditorLayout` の
 * `grid-cols-[19rem_1fr_18rem]`）の 1 列目 `19rem` から、常に左隣に立つレール
 * （`LeftPaneRail` の `w-14` = 56px）を引いた残り（`19rem − 3.5rem = 15.5rem` = 248px）。
 * UI 案（docs/Design Composer.html は左パネルを 5 画面とも 248px と描く）とも一致する。
 * 両者が揃っていることは
 * `features/editor/components/editor-layout/__tests__/editor-layout.pane-width.test.tsx`
 * が固定する。
 *
 * Tailwind のスケール値（`w-62`）ではなく任意値で書くのは、テストの `arbitraryValue` が
 * `w-[...]` の角括弧の中身を文字列として取り出してグリッドの列と突き合わせるため。
 *
 * Why not: グリッドの列指定から組み立てない。Tailwind の JIT はソース中のリテラルしか
 * 拾わないので、変数から組んだ class 名は CSS が生成されない。
 */
const LeftPaneWidthClass = "w-[15.5rem]";

/** 殻そのもの。幅のほかに持つのは枠線と地の色だけで、余白も高さも持たない。 */
const ShellClass = `${LeftPaneWidthClass} border border-gray-300 bg-white`;

/**
 * ストーリーの中で左ペインのパネル（`EditorLayout.LeftPane` の中に立つ
 * `LeftPanePanel`）の代わりに置く枠。パレット・トークン一覧・ツリーなど、パネルに出る
 * 部品を実画面と同じ幅で見るために使う。
 *
 * 殻が持つのは幅と枠線と地色だけ。余白（`p-3`）はストーリーごとの都合なので殻には持たせず、
 * 必要なストーリーが children 側に付ける（実画面のパネル本体が余白を内側に持つのと同じ形）。
 * 高さも殻には持たせない（本文系はどれも中身の高さで足りる）。
 *
 * 横断層に置いているのは、左ペインのパネルを真似ているストーリーが 3 つの feature
 * （`assets` / `tokens` / `sidebar`）に散っていて、幅の綴りが 6 箇所へ写され、しかも
 * `w-62`(248px) と `w-64`(256px) の 2 通りに割れていたため（#304）。
 *
 * 名前に `LeftPane` を付けているのは、右ペインの殻（`RightPaneShell`）と幅が別
 * （左 15.5rem / 右 18rem）で、着せ替えできる 1 つの部品にできないため。
 *
 * Why not: 本物のパネル（`LeftPanePanel`）は使えない。幅を持っているのは親の
 * グリッドの列とレールの引き算で `LeftPanePanel` 単体では幅が出ないうえ、横断層から
 * `features/` は import できない（.oxlintrc.json）。
 *
 * @returns 受け取った中身を、左ペインのパネルと同じ幅の枠に入れたもの
 */
export function LeftPaneShell({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return <div className={ShellClass}>{children}</div>;
}

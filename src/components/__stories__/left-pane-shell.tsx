import type { ReactElement, ReactNode } from "react";

/**
 * 左ペインのパネル部の幅。編集画面のグリッド（`EditorLayout` の
 * `grid-cols-[19rem_1fr_18rem]`）の 1 列目 19rem から、常に左隣に立つレール（`LeftPaneRail`
 * の `w-14`）を引いた残り。
 *
 * 両者が揃っていることは `editor-layout.pane-width.test.tsx` が固定し、UI 案（docs/Design
 * Composer.html も左パネルを 5 画面とも 248px と描く）とも一致する。任意値（`w-[...]`）
 * で書くのは、そのテストが角括弧の中身を文字列として取り出して突き合わせるため。
 *
 * グリッドの列指定から組み立てないのは、Tailwind の JIT がソース中のリテラルしか拾わず、
 * 変数から組んだ class 名は CSS が生成されないため。
 */
const LeftPaneWidthClass = "w-[15.5rem]";

/** 殻そのもの。幅のほかに持つのは枠線と地の色だけで、余白も高さも持たない。 */
const ShellClass = `${LeftPaneWidthClass} border border-gray-300 bg-white`;

/**
 * ストーリーの中で左ペインのパネル（`LeftPanePanel`）の代わりに置く枠。パネルに出る部品
 * を実画面と同じ幅で見るために使う。
 *
 * 殻が持つのは幅と枠線と地色だけで、余白と高さはストーリーごとの都合なので children 側
 * が付ける。横断層に置くのは、左ペインを真似ているストーリーが 3 つの feature に散り、
 * 幅の綴りが 6 箇所へ 2 通りに割れていたため（#304）。
 *
 * 本物のパネルを使えないのは、幅を持っているのが親のグリッドとレールの引き算で単体では
 * 幅が出ないうえ、横断層から `features/` を import できないため。
 *
 *         @returns 受け取った中身を、左ペインのパネルと同じ幅の枠に入れたもの
 */
export function LeftPaneShell({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactElement {
  return <div className={ShellClass}>{children}</div>;
}

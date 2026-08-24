import type { ReactElement, ReactNode } from "react";

/**
 * 右ペインの幅。編集画面のグリッド（`EditorLayout` の `grid-cols-[19rem_1fr_18rem]`）の
 * 3 列目の写しで、両者が揃っていることは
 * `features/editor/components/editor-layout/__tests__/editor-layout.pane-width.test.tsx`
 * が固定する。
 *
 * Tailwind のスケール値ではなく任意値で書くのは、グリッドの列と同じ綴りにしておくと
 * テストが文字列として突き合わせられるため（スケール値で書いても同じ 18rem なので、
 * 見た目は動かない）。
 *
 * Why not: グリッドの列指定から組み立てない。Tailwind の JIT はソース中のリテラルしか
 * 拾わないので、変数から組んだ class 名は CSS が生成されない。
 *
 * この 18rem は UI 案（docs/Design Composer.html は右ペインを 5 画面とも 264px と描く）
 * とずれているが、それは編集画面のグリッド側に元からある乖離で、ここはその写し。
 */
const RightPaneWidthClass = "w-[18rem]";

/** 殻そのもの。幅のほかに持つのは枠線と地の色だけで、余白は持たない。 */
const ShellClass = `${RightPaneWidthClass} border border-gray-300 bg-white`;

/**
 * 枠の高さを何に合わせるか。
 *
 * - `content` — 中身の高さ。帯だけ・部品 1 つを 1 枚で見るときに使う
 * - `pane` — 実画面のペインと同じ縦の長さ。帯と本文を縦に並べるときに使う
 */
type RightPaneShellHeight = "content" | "pane";

/**
 * 高さの決め方ごとに殻へ足す class。
 *
 * `switch` に `default` を置かず戻り値を `string` にしているので、高さの選択肢を
 * 足してここを足し忘れるとコンパイルエラーになる
 * （rules/coding.md「列挙した状態の網羅を型で強制する」）。
 *
 * **どちらの枝を落としてもテストは 1 件も落ちない** — 幅は両方の枝が同じものを持つので、
 * 突き合わせのテストは高さと縦並びを見ていない。気づく手段は視覚差分だけ。
 *
 * @param height 枠の高さを何に合わせるか
 * @returns 中身の高さに合わせるなら空、ペインの高さに合わせるなら高さと縦並びの class
 */
function heightClass(height: RightPaneShellHeight): string {
  switch (height) {
    case "content":
      return "";
    case "pane":
      return "flex h-[32rem] flex-col";
  }
}

/**
 * ストーリーの中で右ペインの殻（`EditorLayout.RightPane` とそれを載せるグリッドの列）の
 * 代わりに置く枠。帯（`PaneHeading`）・本文（`PaneBody`）・その中に並ぶ部品を、
 * 実画面と同じ幅で見るために使う。
 *
 * 殻は余白を持たない。帯の下線がペインの両端まで届くことを絵に載せるため、余白は
 * 本文が内側に持つ（実画面と同じ形）。
 *
 * `pane` の高さを 32rem に固定しているのは、**本文がスクロールを受けていることを
 * 視覚差分に載せるため**。`features/inspector` の `artboard を選択中` はこの高さに
 * 収まらずスクロールバーが絵に出る（`features/tokens` はどれも収まる）。
 *
 * 横断層に置いているのは、右ペインの殻を真似ているストーリーが `src/components/` と
 * 2 つの feature（`inspector` / `tokens`）に散っていて、幅の綴りが 7 箇所へ写されて
 * いたため（#300）。
 *
 * 名前に `RightPane` を付けているのは、帯や本文（`PaneHeading` / `PaneBody`）と違って
 * **どのペインにも使える部品ではない**ため。持っている幅は 3 列目（18rem）で、左ペイン
 * （19rem）のストーリーがこれを着ると 1rem ずれる（左ペインの枠は #304）。
 *
 * Why not: 本物の殻（`EditorLayout.RightPane`）は使えない。幅を持っているのは親の
 * グリッドの列で `RightPane` 単体では幅が出ないうえ、横断層から `features/` は
 * import できない（.oxlintrc.json）。
 *
 * @returns 受け取った中身を、右ペインと同じ幅の枠に入れたもの
 */
export function RightPaneShell({
  height,
  children,
}: Readonly<{
  height: RightPaneShellHeight;
  children: ReactNode;
}>): ReactElement {
  return (
    <div className={`${ShellClass} ${heightClass(height)}`.trim()}>
      {children}
    </div>
  );
}

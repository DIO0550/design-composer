import type { ReactElement, ReactNode } from "react";

/**
 * 帯（`PaneHeading`）の下に置く本文。縦スクロールはここが受ける。
 *
 * ペインの器ではなくここが余白を持つのは、帯の下線をペインの両端まで届かせるため。
 *
 * 横断層に置いているのは、右ペインの中身を持つ feature（`inspector` / `tokens`）の
 * ストーリーが、この綴りを写さずに同じものを描けるようにするため（#297）。
 *
 * スクロールバーの幅は出ていないときも空けておく（`scrollbar-gutter: stable`）。
 * 空けないと、中身がペインの高さを越えた瞬間に中身が幅の分だけ左へ寄る。トークンを選び直す
 * たびに参照元の件数が変わるので、入力欄が横に跳ねて見える。
 * 幅を取らないスクロールバー（macOS の重ね表示）では、この指定は何も足さない。
 *
 * **この器を落としてもテストは 1 件も落ちない** — 持っているのはスクロールと余白だけで、
 * happy-dom はそれを解決しない。気づく手段は、これを描いているストーリーの視覚差分だけ。
 * 中身をそのまま出すことだけは、これを着せている編集画面のテストが守っている
 * （ここに `__tests__/` を置いていないのはそのため）。
 *
 * @returns 受け取った中身を、余白付きで縦スクロールする枠に入れたもの
 */
export function PaneBody({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <div className="min-h-0 flex-1 overflow-auto p-3 [scrollbar-gutter:stable]">
      {children}
    </div>
  );
}

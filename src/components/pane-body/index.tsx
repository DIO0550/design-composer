import type { ReactElement, ReactNode } from "react";

/**
 * 帯（`PaneHeading`）の下に置く本文。縦スクロールはここが受ける。
 *
 * ペインの器ではなくここが余白を持つのは、帯の下線をペインの両端まで届かせるため。横断層に置く
 * のは、右ペインの中身を持つ feature（`inspector` / `tokens`）のストーリーが、この綴りを写さずに
 * 同じものを描けるようにするため（#297）。
 *
 * スクロールバーの幅は出ていないときも空けておく（`scrollbar-gutter: stable`）。空けないと、中身が
 * ペインの高さを越えた瞬間に中身が幅の分だけ左へ寄る。
 *
 * **この器を落としてもテストは 1 件も落ちない** — 持っているのはスクロールと余白だけで happy-dom が
 * 解決しないため。気づく手段は、これを描いているストーリーの視覚差分だけ。
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

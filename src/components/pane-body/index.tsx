import type { ReactElement, ReactNode } from "react";

/**
 * 帯（`PaneHeading`）の下に置く本文。縦スクロールはここが受ける。
 *
 * ペインの器ではなくここが余白を持つのは、帯の下線をペインの両端まで届かせるため。横断
 * 層に置くのは、右ペインの中身を持つ feature（`inspector` / `tokens`）のストーリーが綴
 * りを写さずに済むようにするため（#297）。スクロールバーの幅は出ていないときも空けてお
 * く（空けないと、中身がペインの高さを越えた瞬間に幅の分だけ左へ寄る）。
 *
 * **この器を落としてもテストは 1 件も落ちない** — 気づく手段は視覚差分だけ（持っている
 * のはスクロールと余白だけで happy-dom が解決しない）。中身をそのまま出すことだけは、こ
 * れを着せている編集画面のテストが守っている（ここに `__tests__/` を置いていないのはそ
 * のため）。
 *
 *       @returns 受け取った中身を、余白付きで縦スクロールする枠に入れたもの
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

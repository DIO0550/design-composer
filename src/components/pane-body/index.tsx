import type { ReactElement, ReactNode } from "react";

/**
 * 帯（`PaneHeading`）の下に置く本文。縦スクロールはここが受ける。
 *
 * ペインの器ではなくここが余白を持つのは、帯の下線をペインの両端まで届かせるため。
 *
 * 横断層に置いているのは、右ペインの中身を持つ feature（`inspector` / `tokens`）の
 * ストーリーが、この綴りを写さずに同じものを描けるようにするため（#297）。
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
  return <div className="min-h-0 flex-1 overflow-auto p-3">{children}</div>;
}

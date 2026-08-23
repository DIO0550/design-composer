import type { ReactElement, ReactNode } from "react";

/**
 * 部品 1 つを、実際の右ペインと同じ幅・同じ余白で見るための器。
 *
 * 部品ごとのストーリーが同じ綴りを書き写さずに済むよう 1 つに置く。幅と余白は
 * `property-panel/index.stories.tsx` の器に合わせてあり、そちらが動いたらここも動かす
 * （どちらも `editor-layout` の `RightPane` の写し）。
 *
 * @returns 受け取った部品を右ペインの幅の枠に入れたもの
 */
export function PanelFrame({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <div className="w-72 border border-gray-300 bg-white p-3 text-sm">
      {children}
    </div>
  );
}

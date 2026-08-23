import type { ReactElement, ReactNode } from "react";

/**
 * 部品 1 つを、実際の右ペインと同じ幅・同じ余白で見るための器。
 *
 * 部品ごとのストーリーが同じ綴りを書き写さずに済むよう 1 つに置く。余白は本文
 * （`PaneBody`）と同じ 12px。**幅（`w-72`）は右ペインの幅（`EditorLayout` の `18rem`）の
 * 写しなので、そちらが動いたらここも動かす**（ストーリー用の枠を寄せるかは #300）。
 *
 * Why not: `PaneBody` そのものは使わない。本文は縦スクロールを受けるために
 * `min-h-0 flex-1 overflow-auto` を持つが、ここは `layout: padded` の 1 枚で、
 * flex の親も高さも無いのでそれらが意味を持たない。
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

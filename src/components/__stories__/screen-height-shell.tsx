import type { ReactElement, ReactNode } from "react";

/**
 * ストーリーの中で、高さを親に合わせる画面の器に画面の高さを与える殻。
 *
 * 画面いっぱいに広がる器（`EditorLayout` / `OpenedDocumentEditor` / `DocumentStart`）は高さを
 * 親に合わせるが、ストーリーは素の `#storybook-root`（高さ auto）へ描くため、これを被せないと
 * `h-full` が中身の高さに解決されて実画面と違う絵になる（#322 / #344）。
 *
 * 本物の画面がこの器の上に積むもの（`EditorTopBar` 等）は写さない。入れると、その帯を触った
 * だけで使う側のストーリーの絵が動く。
 *
 * @returns 画面の高さを持つ器に children を入れた要素
 */
export function ScreenHeightShell({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className="h-screen">{children}</div>;
}

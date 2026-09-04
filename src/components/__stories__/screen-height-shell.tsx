import type { ReactElement, ReactNode } from "react";

/**
 * ストーリーの中で、高さを親に合わせる画面の器に画面の高さを与える殻。
 *
 * 画面いっぱいに広がる器（編集画面の `EditorLayout` / `OpenedDocumentEditor`、
 * ドキュメントを開く前の `DocumentStart`）は高さを画面ではなく親に合わせるが、
 * ストーリーは素の `#storybook-root`（高さ auto）へ直接描くため、これを被せないと
 * `h-full` が中身の高さに解決されて実画面と違う絵になる（#322 / #344）。複数の feature が
 * 使うので `src/components/__stories__/` に置く（`rules/architecture.md`「ストーリー専用の共有物」）。
 *
 * 本物の画面がこの器の上に積むもの（編集画面の `EditorTopBar` と `DocumentSyncFailureList`）は
 * 写さない。何が上に載るかは使う側による。
 * Why not: 本物の帯を入れると、その帯を触っただけで使う側のストーリーの絵が動く。
 *
 * @returns 画面の高さを持つ器に children を入れた要素
 */
export function ScreenHeightShell({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className="h-screen">{children}</div>;
}

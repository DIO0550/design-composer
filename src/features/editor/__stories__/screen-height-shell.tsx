import type { ReactElement, ReactNode } from "react";

/**
 * ストーリーの中で、編集画面の器に画面の高さを与える殻。
 *
 * 編集画面の器（`EditorLayout` とそれを組む `OpenedDocumentEditor`）は高さを画面ではなく
 * 親に合わせるが、ストーリーは素の `#storybook-root`（高さ auto）へ直接描くため、これを
 * 被せないと `h-full` が中身の高さに解決されて実画面と違う絵になる（#322 / #344）。
 *
 * 本物の画面がこの器の上に積む帯（`EditorScreen` の `DocumentToolbar`、
 * `OpenedDocumentEditor` の `EditorTopBar` と `DocumentSyncFailureList`）は写さない。
 * どれが上に載るかは使う側による。
 * Why not: 本物の帯を入れると、その帯を触っただけで編集画面のストーリーの絵が動く。
 *
 * これを外したときに気づく手段は Storybook の視覚差分だけ（`OpenedDocumentEditor` は
 * 中身が撮影範囲を超えるので `capture` の検査でも落ちるが、潰れる側は落ちない）。
 *
 * @returns 画面の高さを持つ器に children を入れた要素
 */
export function ScreenHeightShell({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return <div className="h-screen">{children}</div>;
}

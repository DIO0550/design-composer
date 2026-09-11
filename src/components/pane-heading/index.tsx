import type { ReactElement, ReactNode } from "react";

/** 帯を引くための目印。 */
export const PaneHeadingTestId = "pane-heading";

/**
 * ペインの上端に置く見出しの帯（UI 案 docs/Design Composer.html の右ペインの帯。44px）。
 * 中身は並べる側が決めるので children で受け、**省略可能にしない**（渡し忘れと意図した
 * 空が書き分けられなくなる）。
 *
 * 左ペインのパネルの帯（`LeftPanePanel`）はこれではなく、本文（`PaneBody`）と 1 つの名前空
 * 間にもまとめない（親の殻が `features/editor` に残る）。
 *
 * **この class を落としてもテストは 1 件も落ちない**（高さ・下線・余白は happy-dom が解
 * 決しない） — 気づく手段は視覚差分だけ。
 *
 * @returns 受け取った中身を横に並べた、下線付きの固定高の帯
 */
export function PaneHeading({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <div
      data-testid={PaneHeadingTestId}
      className="flex h-11 shrink-0 items-center gap-2 border-gray-300 border-b px-3"
    >
      {children}
    </div>
  );
}

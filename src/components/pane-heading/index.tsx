import type { ReactElement, ReactNode } from "react";

/** 帯を引くための目印。 */
export const PaneHeadingTestId = "pane-heading";

/**
 * ペインの上端に置く見出しの帯（UI 案 docs/Design Composer.html の右ペインの帯。44px）。
 * 中身は並べる側が決めるので children で受ける。
 *
 * 中身が空になっても帯そのものは残る。空のときは読み上げ名も見出しも持たず要素として
 * 指せないので、「帯が残っている」ことを確かめられるよう目印を持たせる。
 *
 * **中身を省略可能にしない。** 渡し忘れと「意図して空にした」が書き分けられなくなる。
 *
 * **この class を落としてもテストは 1 件も落ちない** — 目印が守るのは帯が在ることだけで、
 * 高さ・下線・余白・間隔は happy-dom が解決しない。気づく手段は視覚差分だけ。
 *
 * 横断層に置いているのは、右ペインの中身を持つ feature（`inspector` / `tokens`）の
 * ストーリーが、この綴りを写さずに同じものを描けるようにするため（#297）。
 *
 * Why not: 左ペインのパネルの帯（`features/sidebar` の `LeftPanePanel`）はこれではない。
 * 高さは同じだが `gap-2` を持たず、本文も `flex flex-col gap-4` を追加で持つ。
 *
 * Why not: 本文（`PaneBody`）と 1 つの名前空間（`Pane.Heading` / `Pane.Body`）にまとめない。
 * 親にあたる殻は `features/editor` に残るので、親のいない名前空間になる。
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

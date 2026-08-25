import type { ReactElement } from "react";

/** テストから引くための目印。キャンバスの `DropMarker` と同じ扱い。 */
export const DropLineTestId = "drop-line";

/**
 * 並べ替えで落ちる先を示す線（UI 案 docs/Design Composer.html は並べ替えの提示を
 * 描いていないので、キャンバスの `DropMarker`（挿入位置に引く線）の流儀に寄せている）。
 *
 * 読み上げから外すのは、掴んで運ぶ操作がポインタ専用で、この線を読む相手が
 * 居ないため（キャンバスの `DropMarker` も同じ理由で `aria-hidden`）。代わりに
 * `data-testid` を持たせて、線が出ているかをテストから読めるようにする。
 * class にしか出ない形にすると happy-dom では読めず、確かめる手段が視覚差分だけに
 * なるが、**運んでいる最中の見た目はストーリーにも出せない**ので視覚差分でも捕まらない。
 *
 * @returns 落ちる先を示す 2px の線
 */
export function DropLine({
  side,
}: Readonly<{
  /** 行のどちら側に引くか。上へ動かしているなら `before`、下へなら `after` */
  side: "before" | "after";
}>): ReactElement {
  return (
    <span
      data-testid={DropLineTestId}
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 h-0.5 bg-blue-500 ${
        side === "before" ? "top-0" : "bottom-0"
      }`}
    />
  );
}

import type { ReactElement } from "react";
import type { DropSide } from "@/utils/ReorderDrag";

/** テストから引くための目印。キャンバスの `DropMarker` と同じ扱い。 */
export const DropLineTestId = "drop-line";

/**
 * 並べ替えで落ちる先を示す線。
 *
 * UI 案はツリーや artboard の並べ替えの提示を描いていないが、キャンバスのドラッグには挿入位置の
 * 線を `#0d99ff`（3px）で描いているので、同じ「落ちる先を示す線」として色をそちらへ合わせた
 * （キャンバスの `DropMarker` の緑は選択の枠と同時に出るための色で、左ペインでは要らない）。
 *
 * UI 案は docs/Design Composer.html。読み上げから外すのは、掴んで運ぶ操作がポインタ専用でこの線を
 * 読む相手が居ないため。代わりに `data-testid` / `data-side` を持たせるのは、class にしか出ない形に
 * すると happy-dom では読めないから（太さと色は class にしか出ないので、確かめる手段は自分の
 * ストーリーの視覚差分だけ）。
 *
 * @returns 落ちる先を示す 2px の線
 */
export function DropLine({ side }: Readonly<{ side: DropSide }>): ReactElement {
  return (
    <span
      data-testid={DropLineTestId}
      data-side={side}
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 h-0.5 bg-[#0d99ff] ${
        side === "before" ? "top-0" : "bottom-0"
      }`}
    />
  );
}

import type { ReactElement } from "react";
import type { DropSide } from "@/utils/ReorderDrag";

/** テストから引くための目印。キャンバスの `DropMarker` と同じ扱い。 */
export const DropLineTestId = "drop-line";

/**
 * 並べ替えで落ちる先を示す線。
 *
 * UI 案（docs/Design Composer.html）は**ツリーや artboard の並べ替え**の提示を
 * 描いていないが、キャンバスのドラッグには挿入位置の線を `#0d99ff`（3px）で
 * 描いている。同じ「落ちる先を示す線」なので色をそちらへ合わせた。
 * Why not: キャンバスの `DropMarker` の緑（`emerald-500`）に揃えない。あちらが
 * 緑なのは選択の枠（青）と同時に出て見分けが要るためで、左ペインでは選択の色と
 * 同時に出ないので、UI 案のアクセント色をそのまま使える。
 *
 * 読み上げから外すのは、掴んで運ぶ操作がポインタ専用で、この線を読む相手が
 * 居ないため（`DropMarker` も同じ理由で `aria-hidden`）。代わりに `data-testid` と
 * `data-side` を持たせて、線が出ているかと**どちら側か**をテストから読めるようにする。
 * class にしか出ない形にすると happy-dom では読めない。
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

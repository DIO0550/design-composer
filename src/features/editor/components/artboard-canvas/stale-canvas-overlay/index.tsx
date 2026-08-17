import type { ReactElement } from "react";

/**
 * 斜線のスクリム（UI 案 docs/Design Composer.html の Error 画面の実測値は
 * `repeating-linear-gradient(-45deg, transparent 0 22px, rgba(209,52,56,0.055) 22px 24px)`）。
 *
 * この斜線を落としてもバッジは残り、テストは 1 件も落ちない。
 * 気づく手段は Storybook の視覚差分だけ。
 */
const StaleScrimClass =
  "bg-[repeating-linear-gradient(-45deg,transparent_0_22px,rgba(209,52,56,0.055)_22px_24px)]";

/**
 * ファイルが不正な間、キャンバスへ重ねるもの（#135）。斜線のスクリムと、
 * 映っているのが最後に正常だった表示であることを名乗るバッジ。
 *
 * スクリムが `pointer-events-none` なのは、下のキャンバスを掴んで動かせるようにするため
 * （凍らせるのは編集で、どこを見るかは変えられてよい）。
 *
 * @returns キャンバス全面の斜線と、右上のバッジ
 */
export function StaleCanvasOverlay(): ReactElement {
  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${StaleScrimClass}`}
      />
      {/* 掴んで動かす操作を食わないよう、バッジもポインタを素通しする */}
      <p className="pointer-events-none absolute top-3.5 right-3.5 rounded-[5px] border border-red-200 bg-white px-2 py-1 font-semibold text-[10px] text-red-600">
        最後に正常だった表示
      </p>
    </>
  );
}

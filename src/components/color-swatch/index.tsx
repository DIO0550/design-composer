import type { ReactElement } from "react";

/** 見本を引くための目印。 */
export const ColorSwatchTestId = "color-swatch";

/**
 * 色そのものを見せる見本。
 *
 * 何の色かは隣に並ぶ文字（トークン名・値）が伝えるので、見本自体は飾りとして
 * 読み上げから外す。読み上げ名を持たない＝役割で引けないため、出す / 出さないを
 * 確かめられるよう目印を持たせる。
 *
 * @returns その色で塗った四角
 */
export function ColorSwatch({
  color,
}: Readonly<{ color: string }>): ReactElement {
  return (
    <span
      aria-hidden="true"
      data-testid={ColorSwatchTestId}
      // 色は値そのものなのでクラス名に固定できない
      style={{ backgroundColor: color }}
      // 白い色でも輪郭が見えるよう枠を付ける
      className="inline-block size-3 shrink-0 border border-gray-300"
    />
  );
}

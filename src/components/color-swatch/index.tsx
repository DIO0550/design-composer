import type { CSSProperties, ReactElement } from "react";

/** 見本を引くための目印。 */
export const ColorSwatchTestId = "color-swatch";

/** 階調の見本を引くための目印。色の見本と出し分けを確かめられるよう別にする。 */
export const GradientSwatchTestId = "gradient-swatch";

/**
 * 見本の殻。白い色・白を含む階調でも輪郭が見えるよう枠を付ける。
 *
 * @param testId 出す / 出さないを確かめるための目印
 * @param paint 見本を塗る style（色・階調は値そのものなのでクラス名に固定できない）
 * @returns 塗った四角
 */
function Swatch({
  testId,
  paint,
}: Readonly<{ testId: string; paint: CSSProperties }>): ReactElement {
  return (
    <span
      aria-hidden="true"
      data-testid={testId}
      style={paint}
      className="inline-block size-3 shrink-0 border border-gray-300"
    />
  );
}

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
    <Swatch testId={ColorSwatchTestId} paint={{ backgroundColor: color }} />
  );
}

/**
 * 階調そのものを見せる見本。読み上げから外す理由は `ColorSwatch` と同じ。
 *
 * @param gradient CSS の `background-image` に置ける階調（`linear-gradient(...)` など）
 * @returns その階調で塗った四角
 */
export function GradientSwatch({
  gradient,
}: Readonly<{ gradient: string }>): ReactElement {
  return (
    <Swatch
      testId={GradientSwatchTestId}
      paint={{ backgroundImage: gradient }}
    />
  );
}

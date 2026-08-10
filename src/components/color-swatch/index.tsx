/**
 * 色そのものを見せる見本。
 *
 * 色は値なのでクラス名に固定できず、インライン style で塗る。何の色かは隣に並ぶ
 * 文字（トークン名・値）が伝えるので、見本自体は飾りとして読み上げから外す。
 */
export function ColorSwatch({ color }: Readonly<{ color: string }>) {
  return (
    <span
      aria-hidden="true"
      // 白い色でも輪郭が見えるよう枠を付ける
      style={{ backgroundColor: color }}
      className="inline-block size-3 shrink-0 border border-gray-300"
    />
  );
}

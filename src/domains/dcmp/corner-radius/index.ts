import { LengthShorthand } from "@/domains/dcmp/length-shorthand";
import type { PropValue } from "@/domains/dcmp/node";

/**
 * 4 隅で表す角丸（docs/03「角丸は 4 隅個別」）。
 * 各隅の値は radius トークン名で、省略はその隅を指定しないことを表す。
 */
export type CornerRadius = Readonly<{
  topLeft?: PropValue;
  topRight?: PropValue;
  bottomRight?: PropValue;
  bottomLeft?: PropValue;
}>;

export const CornerRadius = {
  /**
   * CSS の border-radius shorthand へ合成するための並び。
   *
   * 並びは 左上 右上 右下 左下（docs/03「左上 右上 右下 左下 の順で4値に合成」）。隅を
   * 並びへ直すのはこの 1 箇所だけで、呼び出し側は名前で隅を指す。
   *
   * @param radius 並びにする角丸
   * @returns `border-radius` プロパティへ 左上 右上 右下 左下 の順で合成する shorthand
   */
  toLengthShorthand(radius: CornerRadius): LengthShorthand {
    return LengthShorthand.create("border-radius", [
      radius.topLeft,
      radius.topRight,
      radius.bottomRight,
      radius.bottomLeft,
    ]);
  },
} as const;

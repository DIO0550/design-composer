import { LengthShorthand } from "@/domains/dcmp/length-shorthand";
import type { PropValue } from "@/domains/dcmp/node";

/**
 * 4 方向で表すパディング（docs/03「padding は 4 方向個別」）。
 * 各辺の値は spacing トークン名で、省略はその辺を指定しないことを表す。
 */
export type Padding = Readonly<{
  top?: PropValue;
  right?: PropValue;
  bottom?: PropValue;
  left?: PropValue;
}>;

export const Padding = {
  /**
   * CSS の padding shorthand へ合成するための並び。
   *
   * 並びは 上 右 下 左（docs/03「上 右 下 左 の順で4値に合成」）。辺を並びへ直すのはこの
   * 1 箇所だけで、呼び出し側は名前で辺を指す。
   *
   * @param padding 並びにするパディング
   * @returns `padding` プロパティへ 上 右 下 左 の順で合成する shorthand
   */
  toLengthShorthand(padding: Padding): LengthShorthand {
    return LengthShorthand.create("padding", [
      padding.top,
      padding.right,
      padding.bottom,
      padding.left,
    ]);
  },
} as const;

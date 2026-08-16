import { CssDeclaration } from "@/domains/css-declaration";
import type { PropValue } from "@/domains/node";

/** 未指定の軸が取る長さ。 */
const None = "0";

/**
 * X / Y の2軸で表すパディング
 * (docs/03「padding は Figma の基本操作に合わせ X / Y の2軸」)。
 * 各軸の値は spacing トークン名で、省略はその軸を指定しないことを表す。
 */
export type Padding = Readonly<{
  y?: string;
  x?: string;
}>;

export const Padding = {
  create(y: PropValue | undefined, x: PropValue | undefined): Padding {
    return {
      ...(y === undefined ? {} : { y: String(y) }),
      ...(x === undefined ? {} : { x: String(x) }),
    };
  },

  /** 2軸とも未指定。パディングを持たないことを表す。 */
  isEmpty(padding: Padding): boolean {
    return padding.y === undefined && padding.x === undefined;
  },

  /**
   * CSS の padding shorthand を Y X の順で合成する。未指定の軸は 0 になる。
   * トークン名をどう参照するか(カスタムプロパティ名の規則)は CSS の出力層が持つため、
   * 変換は引数で受け取りドメインからは切り離す。
   */
  cssValue(padding: Padding, resolveToken: (token: string) => string): string {
    const y = padding.y === undefined ? None : resolveToken(padding.y);
    const x = padding.x === undefined ? None : resolveToken(padding.x);
    return `${y} ${x}`;
  },

  /** パディングを持たないときは宣言を出力しない。 */
  declarations(
    padding: Padding,
    resolveToken: (token: string) => string,
  ): readonly CssDeclaration[] {
    if (Padding.isEmpty(padding)) {
      return [];
    }
    return [
      CssDeclaration.create("padding", Padding.cssValue(padding, resolveToken)),
    ];
  },
} as const;

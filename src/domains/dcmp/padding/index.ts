import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import type { PropValue } from "@/domains/dcmp/node";

/** 未指定の辺が取る長さ。 */
const UnspecifiedLength = "0";

/**
 * 4 方向で表すパディング（docs/03「padding は 4 方向個別」）。
 * 各辺の値は spacing トークン名で、省略はその辺を指定しないことを表す。
 */
export type Padding = Readonly<{
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}>;

/**
 * 生成に渡す 4 辺。すべて省略可で、省略はその辺を指定しないことを表す。
 * 位置引数で 4 つ並べると同じ型が続いて取り違えても型エラーにならないため、
 * 名前で受け取る。
 */
type PaddingSides = Readonly<{
  top?: PropValue;
  right?: PropValue;
  bottom?: PropValue;
  left?: PropValue;
}>;

export const Padding = {
  create(sides: PaddingSides): Padding {
    return {
      ...(sides.top === undefined ? {} : { top: String(sides.top) }),
      ...(sides.right === undefined ? {} : { right: String(sides.right) }),
      ...(sides.bottom === undefined ? {} : { bottom: String(sides.bottom) }),
      ...(sides.left === undefined ? {} : { left: String(sides.left) }),
    };
  },

  /** 4 辺とも未指定。パディングを持たないことを表す。 */
  isEmpty(padding: Padding): boolean {
    return (
      padding.top === undefined &&
      padding.right === undefined &&
      padding.bottom === undefined &&
      padding.left === undefined
    );
  },

  /**
   * CSS の padding shorthand を 上 右 下 左 の順で合成する。未指定の辺は 0 になる。
   * トークン名をどう参照するか(カスタムプロパティ名の規則)は CSS の出力層が持つため、
   * 変換は引数で受け取りドメインからは切り離す。
   *
   * 4 辺が揃っていても 1 値へ畳まないのは、出力の形が値によって変わらないほうが
   * 読み手にもテストにも一貫するため（畳んで得られるのは生成物のわずかなサイズ減だけ）。
   *
   * @param padding 合成するパディング
   * @param resolveToken トークン名を CSS の長さへ変換する手段
   * @returns 上 右 下 左 の 4 値を空白で連ねた文字列
   */
  cssValue(padding: Padding, resolveToken: (token: string) => string): string {
    const lengths = [
      padding.top,
      padding.right,
      padding.bottom,
      padding.left,
    ].map((side) =>
      side === undefined ? UnspecifiedLength : resolveToken(side),
    );
    return lengths.join(" ");
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

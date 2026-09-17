import {
  CssDeclaration,
  type CssProperty,
} from "@/domains/dcmp/css-declaration";
import type { PropValue } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";

/** 未指定の位置が取る長さ。 */
const UnspecifiedLength = "0";

/** 合成に並ぶ長さ。位置の意味（辺か隅か）は持たず、並びだけを持つ。 */
type ShorthandLengths = readonly [
  Option<string>,
  Option<string>,
  Option<string>,
  Option<string>,
];

/** 合成順に並べた 4 つの位置の値。省略はその位置を指定しないことを表す。 */
type ShorthandValues = readonly [
  PropValue | undefined,
  PropValue | undefined,
  PropValue | undefined,
  PropValue | undefined,
];

/**
 * 4 つの長さトークンを 1 本の CSS shorthand へ合成した値。padding の 4 辺と
 * `border-radius` の 4 隅が同じ規則で合成される（docs/03「HTML/CSS へのコンパイル規則」）。
 *
 * 長さなので**未指定は 0**。`inset` のように未指定が `auto` になる shorthand はこの型では
 * 表せない。
 *
 * どの位置がどの辺・どの隅かは、並びを組む側（`Padding` / `CornerRadius`）が持つ。
 */
export type LengthShorthand = Readonly<{
  property: CssProperty;
  lengths: ShorthandLengths;
}>;

export const LengthShorthand = {
  /**
   * @param property 合成先の CSS プロパティ
   * @param values 合成順に並べた 4 つの位置の値
   * @returns その並びを合成する shorthand
   */
  create(property: CssProperty, values: ShorthandValues): LengthShorthand {
    const [first, second, third, fourth] = values.map((value) =>
      Option.map(Option.fromNullable(value), String),
    );
    return { property, lengths: [first, second, third, fourth] };
  },

  /** 4 つとも未指定。その shorthand を持たないことを表す。 */
  isEmpty(shorthand: LengthShorthand): boolean {
    return !shorthand.lengths.some((length) => Option.isSome(length));
  },

  /**
   * 並びのまま 4 値へ合成する。未指定の位置は 0 になる。
   *
   * トークン名をどう参照するか（カスタムプロパティ名の規則）は CSS の出力層が持つため、
   * 変換は引数で受け取りドメインからは切り離す。
   *
   * @param shorthand 合成する shorthand
   * @param resolveToken トークン名を CSS の長さへ変換する手段
   * @returns 4 値を空白で連ねた文字列
   */
  cssValue(
    shorthand: LengthShorthand,
    resolveToken: (token: string) => string,
  ): string {
    return shorthand.lengths
      .map((length) =>
        Option.isSome(length) ? resolveToken(length.value) : UnspecifiedLength,
      )
      .join(" ");
  },

  /**
   * @param shorthand 宣言にする shorthand
   * @param resolveToken トークン名を CSS の長さへ変換する手段
   * @returns 合成した宣言 1 件。4 つとも未指定なら空
   */
  declarations(
    shorthand: LengthShorthand,
    resolveToken: (token: string) => string,
  ): readonly CssDeclaration[] {
    if (LengthShorthand.isEmpty(shorthand)) {
      return [];
    }
    return [
      CssDeclaration.create(
        shorthand.property,
        LengthShorthand.cssValue(shorthand, resolveToken),
      ),
    ];
  },
} as const;

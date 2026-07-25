import { Css, type Px } from "@/utils/Css";

export type ShadowToken = Readonly<{
  x: number;
  y: number;
  blur: number;
  spread?: number;
  color: string;
}>;

/** `box-shadow` に渡せる値。`x y blur spread color` の順に並ぶ。 */
export type BoxShadowValue = `${Px} ${Px} ${Px} ${Px} ${string}`;

export const ShadowToken = {
  /** 省略された spread は 0 とみなす(docs/04-tokens.md)。 */
  spreadOf(shadow: ShadowToken): number {
    return shadow.spread ?? 0;
  },

  cssValue(shadow: ShadowToken): BoxShadowValue {
    return `${Css.px(shadow.x)} ${Css.px(shadow.y)} ${Css.px(shadow.blur)} ${Css.px(
      ShadowToken.spreadOf(shadow),
    )} ${shadow.color}`;
  },
} as const;

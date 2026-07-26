import { Px } from "@/domains/px";

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
    return `${Px.create(shadow.x)} ${Px.create(shadow.y)} ${Px.create(shadow.blur)} ${Px.create(
      ShadowToken.spreadOf(shadow),
    )} ${shadow.color}`;
  },
} as const;

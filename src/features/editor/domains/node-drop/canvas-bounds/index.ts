import type { CssDirection } from "@/domains/css-direction";

/**
 * 画面上の矩形（client 座標・px）。
 *
 * 「何番目の子になるか」は実際に描かれた位置と大きさでしか決まらない
 * （レイアウトはブラウザが行う）ため、実測値をこの形でドメインへ渡す。
 */
export type CanvasBounds = Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>;

export const CanvasBounds = {
  /** 子が並ぶ向きに沿った始点。 */
  start(bounds: CanvasBounds, direction: CssDirection): number {
    return direction === "row" ? bounds.left : bounds.top;
  },

  /** 子が並ぶ向きに沿った終点。 */
  end(bounds: CanvasBounds, direction: CssDirection): number {
    return direction === "row"
      ? bounds.left + bounds.width
      : bounds.top + bounds.height;
  },

  /** 子が並ぶ向きに沿った中点。ポインタがここを越えたかで前後が決まる。 */
  center(bounds: CanvasBounds, direction: CssDirection): number {
    return (
      (CanvasBounds.start(bounds, direction) +
        CanvasBounds.end(bounds, direction)) /
      2
    );
  },
} as const;

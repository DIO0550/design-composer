import { CssDirection } from "@/domains/dcmp/css-direction";
import type { Axis } from "@/domains/unit/axis";
import type { Offset } from "@/domains/unit/offset";

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
  /** 描かれている要素の矩形。レイアウトはブラウザが行うので実測で取る。 */
  ofElement(element: Element): CanvasBounds {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  },

  /** 子が並ぶ向きに沿った始点。 */
  start(bounds: CanvasBounds, direction: CssDirection): number {
    return direction === "row" ? bounds.left : bounds.top;
  },

  /** ポインタが矩形の内側にあるか。 */
  contains(bounds: CanvasBounds, pointer: Offset): boolean {
    return (
      pointer.x >= bounds.left &&
      pointer.x <= CanvasBounds.edge(bounds, "width") &&
      pointer.y >= bounds.top &&
      pointer.y <= CanvasBounds.edge(bounds, "height")
    );
  },

  /** 軸に沿った終端（右辺 / 下辺）。リサイズハンドルはこの辺に沿って並ぶ。 */
  edge(bounds: CanvasBounds, axis: Axis): number {
    return axis === "width"
      ? bounds.left + bounds.width
      : bounds.top + bounds.height;
  },

  /** 子が並ぶ向きに沿った終点。 */
  end(bounds: CanvasBounds, direction: CssDirection): number {
    return CanvasBounds.edge(bounds, CssDirection.mainAxis(direction));
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

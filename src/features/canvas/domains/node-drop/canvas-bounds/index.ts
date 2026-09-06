import { CssDirection } from "@/domains/dcmp/css-direction";
import { Axes, type Axis } from "@/domains/unit/axis";
import type { Offset } from "@/domains/unit/offset";
import { Option } from "@/utils/Option";

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

  /**
   * 2 つの矩形が同じ位置・同じ大きさか。
   *
   * 測り直した結果を持ち替えるかどうかの判定に使う（`useDrawnBounds`）。
   * 実測のたびに新しいオブジェクトになるので、参照では比べられない。
   *
   * @param bounds 比べる矩形
   * @param other 比べる相手の矩形
   * @returns 4 つの値がすべて等しければ `true`
   */
  equals(bounds: CanvasBounds, other: CanvasBounds): boolean {
    return (
      bounds.left === other.left &&
      bounds.top === other.top &&
      bounds.width === other.width &&
      bounds.height === other.height
    );
  },

  /**
   * 別の矩形の左上を原点に置き直した矩形。
   *
   * 実測は client 座標で返るが、`position:absolute` で重ねる側は器からの相対で
   * 置く必要があるため、その差を吸収する。
   *
   * @param bounds 置き直す矩形（client 座標）
   * @param origin 原点にする矩形（client 座標）
   * @returns `origin` の左上を (0, 0) とした矩形。大きさは変わらない
   */
  relativeTo(bounds: CanvasBounds, origin: CanvasBounds): CanvasBounds {
    return {
      left: bounds.left - origin.left,
      top: bounds.top - origin.top,
      width: bounds.width,
      height: bounds.height,
    };
  },

  /**
   * 別の矩形の左上から見た、この矩形の左上のずれ。
   *
   * 絶対配置の座標の原点は親の左上なので、これが**親を付け替えたときに座標を直す量**に
   * なる（画面上の位置を変えずに基準だけを移すため）。返るのは実測したままの画面上の
   * px で、ドキュメント上の px にするのは倍率を知っている側（`CanvasView`）の役目。
   *
   * @param bounds ずれを知りたい矩形
   * @param origin 原点にする矩形
   * @returns `origin` の左上から見た `bounds` の左上のずれ
   */
  originShift(bounds: CanvasBounds, origin: CanvasBounds): Offset {
    const relative = CanvasBounds.relativeTo(bounds, origin);
    return { x: relative.left, y: relative.top };
  },

  /** 子が並ぶ向きに沿った始点。 */
  start(bounds: CanvasBounds, direction: CssDirection): number {
    return direction === "row" ? bounds.left : bounds.top;
  },

  /**
   * 幅も高さも正か。
   *
   * 面積を持たない矩形は、そこへ何かを収める倍率も、中の位置も決められない。
   * 実測は描かれる前や器が畳まれているときに 0 を返すので、割り算の前に見る。
   *
   * @param bounds 見る矩形
   * @returns 幅と高さの両方が 0 より大きければ `true`
   */
  hasArea(bounds: CanvasBounds): boolean {
    return bounds.width > 0 && bounds.height > 0;
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

  /**
   * 並び全体を含む最小の矩形。
   *
   * まとめて 1 つの範囲として扱いたいとき（選択したものすべて / artboard すべてを
   * 画面へ収める）に使う。
   *
   * Why: `create` / `from*` は材料から値を作る入口の語で、ここは矩形から矩形を導く操作。
   * 同じモジュールの `relativeTo` / `originShift` と同じく結果そのものを表す語で名付ける。
   *
   * @param boundsList 含めたい矩形の並び
   * @returns すべてを含む最小の矩形。並びが空なら `none`（囲む対象が無いと矩形が決まらない）
   */
  enclosing(boundsList: readonly CanvasBounds[]): Option<CanvasBounds> {
    if (boundsList.length === 0) {
      return Option.none;
    }
    // 空でないことは上で確かめてあるので、無限大の種は必ず 1 件目で置き換わる
    const enclosed = boundsList.reduce(
      (widest, bounds) => ({
        left: Math.min(widest.left, bounds.left),
        top: Math.min(widest.top, bounds.top),
        right: Math.max(widest.right, CanvasBounds.edge(bounds, Axes.Width)),
        bottom: Math.max(widest.bottom, CanvasBounds.edge(bounds, Axes.Height)),
      }),
      {
        left: Number.POSITIVE_INFINITY,
        top: Number.POSITIVE_INFINITY,
        right: Number.NEGATIVE_INFINITY,
        bottom: Number.NEGATIVE_INFINITY,
      },
    );
    return Option.some({
      left: enclosed.left,
      top: enclosed.top,
      width: enclosed.right - enclosed.left,
      height: enclosed.bottom - enclosed.top,
    });
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

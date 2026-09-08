import { CssDirection } from "@/domains/dcmp/css-direction";
import { Axes, type Axis } from "@/domains/unit/axis";
import type { Offset } from "@/domains/unit/offset";
import { type Side, Sides } from "@/domains/unit/side";
import { Option } from "@/utils/Option";

/**
 * 画面上の矩形（client 座標・px）。
 *
 * 位置も大きさもレイアウトを通すまで決まらない（`hug` / `fill` があるので
 * ドキュメントには書かれていない）ため、ブラウザの実測値をこの形でドメインへ渡す。
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

  /**
   * 4 辺のうち 1 辺の座標（左右なら x、上下なら y）。
   *
   * Why: 辺を名前で指す語彙は `unit/side` に既にあるので、そちらへ揃える。向きで引く
   * `start` と軸で引く `edge` もここへ委譲し、**どの数値がどの辺かを 1 箇所に閉じる**。
   *
   * @param bounds 辺を知りたい矩形
   * @param side 知りたい辺
   * @returns その辺の座標（画面上の px）
   */
  side(bounds: CanvasBounds, side: Side): number {
    switch (side) {
      case Sides.Left:
        return bounds.left;
      case Sides.Right:
        return bounds.left + bounds.width;
      case Sides.Top:
        return bounds.top;
      case Sides.Bottom:
        return bounds.top + bounds.height;
    }
  },

  /**
   * 親の矩形の左上から測った位置に、指定した大きさで置いた矩形。
   *
   * 絶対配置の子の**行き先**を画面上の矩形として組み立てるのに使う。大きさを別の矩形から
   * 取るのは、運んでも大きさは変わらないので運んでいるものの実測をそのまま使えるため。
   *
   * **前提: 親の実測矩形（border box）の左上が、絶対配置の子の座標の原点と一致する。**
   * CSS 上の原点は親の padding box なので、両者が一致しているのは `border` 系 prop が
   * まだスキーマに無いからにすぎない（docs/03-schema.md「border 系は初期セットに
   * 含めない」）。border が入ると吸い付く位置が border 幅だけずれるが、テストの実測は
   * 差し替えなので**1 件も落ちずに通る**（気づく手段が無い）。
   *
   * @param parent 原点になる親の矩形
   * @param offset 親の左上から見た位置（画面上の px）
   * @param size 大きさを取る矩形
   * @returns 親の中のその位置に、その大きさで置かれた矩形
   */
  placedAt(
    parent: CanvasBounds,
    offset: Offset,
    size: CanvasBounds,
  ): CanvasBounds {
    return {
      left: parent.left + offset.x,
      top: parent.top + offset.y,
      width: size.width,
      height: size.height,
    };
  },

  /**
   * その量だけずらした矩形。大きさは変わらない。
   *
   * Why（`moveBy` ではなく `movedBy`）: 同じモジュールの `placedAt` / `relativeTo` と
   * 並んで読まれるので、結果を表す語形に揃える（`Placement.moveBy` とは型が違うので
   * 混ざらない）。
   *
   * @param bounds ずらす矩形
   * @param offset ずらす量
   * @returns 左上をその量だけ動かした矩形
   */
  movedBy(bounds: CanvasBounds, offset: Offset): CanvasBounds {
    return {
      left: bounds.left + offset.x,
      top: bounds.top + offset.y,
      width: bounds.width,
      height: bounds.height,
    };
  },

  /** 子が並ぶ向きに沿った始点。 */
  start(bounds: CanvasBounds, direction: CssDirection): number {
    return CanvasBounds.side(
      bounds,
      direction === "row" ? Sides.Left : Sides.Top,
    );
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

  /**
   * 2 点を対角にした矩形。
   *
   * どちらの点が左上かは決まっていない（範囲選択は左上へ向かっても引ける）ので、
   * 小さいほうを左上に取り直す。幅と高さは必ず 0 以上になる。
   *
   * @param from 対角の一方
   * @param to 対角のもう一方
   * @returns 2 点をちょうど囲む矩形
   */
  spanning(from: Offset, to: Offset): CanvasBounds {
    return {
      left: Math.min(from.x, to.x),
      top: Math.min(from.y, to.y),
      width: Math.abs(to.x - from.x),
      height: Math.abs(to.y - from.y),
    };
  },

  /**
   * 2 つの矩形が重なっているか。
   *
   * 辺が接するだけでも重なりとみなす（境界を含む）。同じ型の `contains` が境界を
   * 含んでいるので、2 つの判定で縁の扱いを割らないため。
   *
   * @param bounds 見る矩形
   * @param other 重なりを見る相手の矩形
   * @returns 少しでも重なっていれば `true`
   */
  overlaps(bounds: CanvasBounds, other: CanvasBounds): boolean {
    const apart =
      CanvasBounds.side(bounds, Sides.Right) <
        CanvasBounds.side(other, Sides.Left) ||
      CanvasBounds.side(other, Sides.Right) <
        CanvasBounds.side(bounds, Sides.Left) ||
      CanvasBounds.side(bounds, Sides.Bottom) <
        CanvasBounds.side(other, Sides.Top) ||
      CanvasBounds.side(other, Sides.Bottom) <
        CanvasBounds.side(bounds, Sides.Top);
    return !apart;
  },

  /** ポインタが矩形の内側にあるか。 */
  contains(bounds: CanvasBounds, pointer: Offset): boolean {
    return (
      pointer.x >= CanvasBounds.side(bounds, Sides.Left) &&
      pointer.x <= CanvasBounds.side(bounds, Sides.Right) &&
      pointer.y >= CanvasBounds.side(bounds, Sides.Top) &&
      pointer.y <= CanvasBounds.side(bounds, Sides.Bottom)
    );
  },

  /** 軸に沿った終端（右辺 / 下辺）。リサイズハンドルはこの辺に沿って並ぶ。 */
  edge(bounds: CanvasBounds, axis: Axis): number {
    return CanvasBounds.side(
      bounds,
      axis === Axes.Width ? Sides.Right : Sides.Bottom,
    );
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

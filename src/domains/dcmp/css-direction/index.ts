import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import type { Axis } from "@/domains/unit/axis";
import type { ValueOf } from "@/types/ValueOf";

/**
 * flex コンテナが子を並べる向きを名前で指すための対応表。
 *
 * 値の出どころをここに置き、スキーマ側（`BoxSchema.props.layout`）が `Layouts` 経由で引く
 * （`Constraints` と同じ向き）。向きを持つ側だけを取り出す操作をスキーマの綴りに依存させる
 * と、値の出どころが 2 つに割れる。
 */
export const CssDirections = {
  Row: "row",
  Column: "column",
} as const;

/** flex コンテナが子を並べる方向。 */
export type CssDirection = ValueOf<typeof CssDirections>;

export const CssDirection = {
  /**
   * 子が並ぶ方向にあたる軸。
   *
   * @param direction flex コンテナの向き
   * @returns `row` なら `width`、`column` なら `height`
   */
  mainAxis(direction: CssDirection): Axis {
    return direction === CssDirections.Row ? "width" : "height";
  },

  /**
   * その軸が主軸(子が並ぶ方向)かどうか。
   *
   * @param direction flex コンテナの向き
   * @param axis 見る軸
   * @returns `axis` が `mainAxis` の答えと同じなら `true`
   */
  isMainAxis(direction: CssDirection, axis: Axis): boolean {
    return CssDirection.mainAxis(direction) === axis;
  },

  /**
   * `fill`(親いっぱいに広がる)の宣言。
   * 主軸方向なら伸長し、交差軸方向なら引き伸ばす。
   *
   * @param direction `fill` の子を並べる親の向き
   * @param axis `fill` を指定した軸
   * @returns 主軸なら `flex-grow: 1`、交差軸なら `align-self: stretch` の 1 宣言
   */
  fillDeclaration(direction: CssDirection, axis: Axis): CssDeclaration {
    return CssDirection.isMainAxis(direction, axis)
      ? CssDeclaration.create("flex-grow", "1")
      : CssDeclaration.create("align-self", "stretch");
  },
} as const;

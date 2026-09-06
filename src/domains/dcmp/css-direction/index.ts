import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import type { Axis } from "@/domains/unit/axis";
import type { ValueOf } from "@/types/ValueOf";

/**
 * flex コンテナが子を並べる向きを名前で指すための対応表。
 *
 * 値の出どころをここに置き、スキーマ側（`BoxSchema.props.layout`）が `Layouts` 経由で
 * 引く（`Constraints` と同じ向き）。スキーマから導出しないのは、`layout` の語彙に
 * 「子を並べない」`free` が混ざるため。向きを持つ側だけを取り出す操作をスキーマの
 * 綴りに依存させると、値の出どころが 2 つに割れる。
 */
export const CssDirections = {
  Row: "row",
  Column: "column",
} as const;

/** flex コンテナが子を並べる方向。 */
export type CssDirection = ValueOf<typeof CssDirections>;

export const CssDirection = {
  /** 子が並ぶ方向にあたる軸。 */
  mainAxis(direction: CssDirection): Axis {
    return direction === CssDirections.Row ? "width" : "height";
  },

  /** その軸が主軸(子が並ぶ方向)かどうか。 */
  isMainAxis(direction: CssDirection, axis: Axis): boolean {
    return CssDirection.mainAxis(direction) === axis;
  },

  /**
   * `fill`(親いっぱいに広がる)の宣言。
   * 主軸方向なら伸長し、交差軸方向なら引き伸ばす。
   */
  fillDeclaration(direction: CssDirection, axis: Axis): CssDeclaration {
    return CssDirection.isMainAxis(direction, axis)
      ? CssDeclaration.create("flex-grow", "1")
      : CssDeclaration.create("align-self", "stretch");
  },
} as const;

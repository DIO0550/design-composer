import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import type { PropValue } from "@/domains/dcmp/node";
import { BoxSchema } from "@/domains/dcmp/primitive-schema";
import type { Axis } from "@/domains/unit/axis";

/**
 * flex コンテナが子を並べる方向。
 * Box スキーマの `direction` から導出し二重管理しない。
 */
export type CssDirection =
  (typeof BoxSchema)["props"]["direction"]["values"][number];

export const CssDirection = {
  /** `direction` prop の値から向きを決める。スキーマのデフォルトを既定とする。 */
  from(value: PropValue | undefined): CssDirection {
    return (
      BoxSchema.props.direction.values.find(
        (direction) => direction === value,
      ) ?? BoxSchema.props.direction.default
    );
  },

  /** 子が並ぶ方向にあたる軸。 */
  mainAxis(direction: CssDirection): Axis {
    return direction === "row" ? "width" : "height";
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

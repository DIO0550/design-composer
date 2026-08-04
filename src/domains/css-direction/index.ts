import { CssDeclaration } from "@/domains/css-declaration";
import type { PropValue } from "@/domains/node";
import { BOX_SCHEMA } from "@/domains/primitive-schema";

/**
 * flex コンテナが子を並べる方向。
 * Box スキーマの `direction` から導出し二重管理しない。
 */
export type CssDirection =
  (typeof BOX_SCHEMA)["props"]["direction"]["values"][number];

/** サイズを指定する軸。 */
export const AXES = ["width", "height"] as const;

export type Axis = (typeof AXES)[number];

export const CssDirection = {
  /** `direction` prop の値から向きを決める。スキーマのデフォルトを既定とする。 */
  from(value: PropValue | undefined): CssDirection {
    return (
      BOX_SCHEMA.props.direction.values.find(
        (direction) => direction === value,
      ) ?? BOX_SCHEMA.props.direction.default
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

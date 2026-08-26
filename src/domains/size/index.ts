import { CssDeclaration } from "@/domains/css-declaration";
import { type Axis, CssDirection } from "@/domains/css-direction";
import type { PropValue } from "@/domains/node";
import { Px } from "@/domains/unit/px";
import { Option } from "@/utils/Option";

/**
 * 軸ごとのサイズ指定
 * (docs/03「モード(enum)と値(number)の2 prop に分離」)。
 * 長さを持つのは `fixed` のときだけであることを構造で表す。
 */
export type Size =
  | Readonly<{ mode: "hug" }>
  | Readonly<{ mode: "fill" }>
  | Readonly<{ mode: "fixed"; length: number }>;

export const Size = {
  /**
   * モードと値の 2 prop から組み立てる。
   * `fixed` なのに長さが無い場合など、サイズを決められないときは `undefined`。
   */
  create(
    mode: PropValue | undefined,
    value: PropValue | undefined,
  ): Size | undefined {
    if (mode === "hug") {
      return { mode: "hug" };
    }
    if (mode === "fill") {
      return { mode: "fill" };
    }
    if (mode === "fixed" && typeof value === "number") {
      return { mode: "fixed", length: value };
    }
    return undefined;
  },

  /**
   * その軸のモードを持つ prop 名
   * (docs/03「モード(enum)と値(number)の2 prop に分離」)。
   * 長さ側の prop 名は軸の名前そのもの (`width` / `height`)。
   */
  modeProp(axis: Axis): "widthMode" | "heightMode" {
    return axis === "width" ? "widthMode" : "heightMode";
  },

  /** 固定された長さ。`hug` / `fill` と、長さの決まらないサイズは持たない。 */
  fixedLength(size: Size | undefined): Option<number> {
    return size?.mode === "fixed" ? Option.some(size.length) : Option.none;
  },

  /**
   * サイズを CSS の宣言にする。
   * `fill` だけは親の向きに依存するため (docs/03「唯一親コンテキストに依存するコンパイル」)、
   * 親を持たない位置では flex アイテムではなく宣言が意味を持たないので出力しない。
   */
  declarations(
    size: Size | undefined,
    axis: Axis,
    parentDirection: CssDirection | undefined,
  ): readonly CssDeclaration[] {
    if (size === undefined) {
      return [];
    }
    if (size.mode === "hug") {
      return [CssDeclaration.create(axis, "fit-content")];
    }
    if (size.mode === "fixed") {
      return [CssDeclaration.create(axis, Px.create(size.length))];
    }
    if (parentDirection === undefined) {
      return [];
    }
    return [CssDirection.fillDeclaration(parentDirection, axis)];
  },
} as const;

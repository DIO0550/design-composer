import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import { type Axis, CssDirection } from "@/domains/dcmp/css-direction";
import type { PropValue } from "@/domains/dcmp/node";
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
   * `fill` だけは親の向きに依存する (docs/03「親コンテキストに依存するコンパイル」)。
   *
   * @param size 宣言にするサイズ。サイズが決まらないときは `undefined`
   * @param axis どちらの軸のサイズか
   * @param flexParentDirection flex アイテムとして並ぶ親の向き。フローに参加して
   *   いない位置（親を持たない / 自身が絶対配置）では `undefined`。そこでは `fill`
   *   が意味を持たないので宣言を出さない
   * @returns その軸の宣言。`fill` がフローの外にあるときだけ空
   */
  declarations(
    size: Size | undefined,
    axis: Axis,
    flexParentDirection: CssDirection | undefined,
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
    if (flexParentDirection === undefined) {
      return [];
    }
    return [CssDirection.fillDeclaration(flexParentDirection, axis)];
  },
} as const;

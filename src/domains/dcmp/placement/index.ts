import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import type { PropValue } from "@/domains/dcmp/node";
import { Px } from "@/domains/unit/px";

/**
 * 親の中でのノードの置かれ方
 * (docs/03「配置の指定」)。
 * 座標を持つのは `absolute` のときだけであることを構造で表す。
 */
export type Placement =
  | Readonly<{ mode: "flow" }>
  | Readonly<{ mode: "absolute"; x: number; y: number }>;

export const Placement = {
  /**
   * モードと座標の 3 prop から組み立てる。
   *
   * @param mode `placement` prop に設定されている値
   * @param x `x` prop に設定されている値
   * @param y `y` prop に設定されている値
   * @returns 置かれ方。`absolute` なのに座標が数値でないなど、置き場所を決められない
   *   ときは `undefined`
   */
  create(
    mode: PropValue | undefined,
    x: PropValue | undefined,
    y: PropValue | undefined,
  ): Placement | undefined {
    if (mode === "flow") {
      return { mode: "flow" };
    }
    const hasCoordinates = typeof x === "number" && typeof y === "number";
    if (mode === "absolute" && hasCoordinates) {
      return { mode: "absolute", x, y };
    }
    // Why not: 決められないときに `flow` へ倒さない。スキーマ違反の値を
    // 正しい配置へ読み替えると、検証が報告する不正が画面から消える
    return undefined;
  },

  /** フローから外れて座標で置かれるか。flex アイテムとして並ばない。 */
  isAbsolute(placement: Placement | undefined): boolean {
    return placement?.mode === "absolute";
  },

  /**
   * 置かれ方を CSS の宣言にする。
   *
   * フローの側が宣言を持たないのは、`position` の初期値がフローそのもの
   * (`static`) だから。フローの Box が出す `position: relative` は
   * 「子の基準になれる」という Box の性質なので `BoxElement` が持つ。
   *
   * @param placement 宣言にする置かれ方。置き場所が決まらないときは `undefined`
   * @returns 絶対配置なら `position` と座標の 3 件。それ以外は空
   */
  declarations(placement: Placement | undefined): readonly CssDeclaration[] {
    if (placement === undefined || placement.mode === "flow") {
      return [];
    }
    return [
      CssDeclaration.create("position", "absolute"),
      CssDeclaration.create("left", Px.create(placement.x)),
      CssDeclaration.create("top", Px.create(placement.y)),
    ];
  },
} as const;

import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import type { Props } from "@/domains/dcmp/node";
import { Px } from "@/domains/unit/px";

/**
 * 親の中でのノードの置かれ方
 * (docs/03「配置の指定」)。
 * 座標を持つのは `absolute` のときだけであることを構造で表す。
 *
 * 指しているのは `.dcmp` のノードが親の中でどう置かれるかで、インスタンスを
 * 置いている最中(`InstancePlacementIndicator`)でも、解決値をラベルのどちら側へ
 * 添えるか(`ResolvedValuePlacement`)でもない。
 */
export type Placement =
  | Readonly<{ mode: "flow" }>
  | Readonly<{ mode: "absolute"; x: number; y: number }>;

export const Placement = {
  /**
   * props から置かれ方を組み立てる。
   * 配置を決める 3 prop の綴りを知っているのはここだけで、消費側は prop 名を持たない。
   *
   * 決められないときに `Option` ではなく `undefined` を返すのは、同じ形の
   * `Size.create`(モードと値の 2 prop から直和を組む)と受け口を揃えるため。
   *
   * この `undefined` は「不在」ではなく「スキーマ違反で決められない」を表す。
   * ただし**出力は `flow` と同じ**(座標の宣言を出さない)で、不正そのものは
   * `DesignDocument.collectErrors` がエラー一覧に出す。
   *
   * @param props 配置を読み取る props(デフォルト解決済みでなくてよい)
   * @returns 置かれ方。`absolute` なのに座標が数値でないなど、置き場所を
   *   決められないときは `undefined`
   */
  fromProps(props: Props): Placement | undefined {
    const { placement, x, y } = props;
    if (placement === "flow") {
      return { mode: "flow" };
    }
    const hasCoordinates = typeof x === "number" && typeof y === "number";
    if (placement === "absolute" && hasCoordinates) {
      return { mode: "absolute", x, y };
    }
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

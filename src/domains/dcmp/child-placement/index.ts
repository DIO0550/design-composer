import type { AbsolutePlacement } from "@/domains/dcmp/placement";

/**
 * 絶対配置の子が「どの親の中の、どの座標に置かれるか」。
 *
 * 座標は**親の左上を原点とする値**なので、親の名前と対でなければ画面上の位置が
 * 決まらない（同じ `x` / `y` でも親が違えば別の場所を指す）。片方だけを持ち回れない
 * よう 1 つの型にする。
 *
 * `ChildPosition` と対になる型で、**あちらは並びの位置（何番目の子か）、こちらは
 * 親の中の座標**。絶対配置の子はフローの並びから外れるので、位置の指し方が変わる。
 *
 * 親の名前が子を受け入れられる相手かどうかはここでは決めない（`ChildPosition` が
 * `insertNode` の `Result` に委ねているのと同じ形で、`DesignDocument.reposition` が
 * 失敗として答える）。
 */
export type ChildPlacement = Readonly<{
  parentName: string;
  placement: AbsolutePlacement;
}>;

export const ChildPlacement = {
  /**
   * 親と、その親から見た座標から組み立てる。
   *
   * @param parentName 置かれる先の親の名前
   * @param placement その親の左上を原点とした座標
   * @returns 親と座標の対
   */
  create(parentName: string, placement: AbsolutePlacement): ChildPlacement {
    return { parentName, placement };
  },

  /**
   * その親を指しているか。指すのは**直下の親**だけで、祖先は辿らない。
   *
   * 置き直しで親の付け替えが要るかを、今いる親と比べて決めるのに使う
   * （`DesignDocument.reposition`）。
   *
   * @param childPlacement 見る対
   * @param parentName 比べる親の名前
   * @returns その親を指しているなら `true`
   */
  hasParent(childPlacement: ChildPlacement, parentName: string): boolean {
    return childPlacement.parentName === parentName;
  },
} as const;

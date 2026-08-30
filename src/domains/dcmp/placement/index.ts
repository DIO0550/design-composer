import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import { PropEdit, type Props } from "@/domains/dcmp/node";
import type { Offset } from "@/domains/unit/offset";
import { Px } from "@/domains/unit/px";

/**
 * フローから外れ、親からの相対座標で置かれる配置。
 * 座標を動かす操作はこの枝でしか意味を持たないので、枝そのものを型として公開する。
 */
export type AbsolutePlacement = Readonly<{
  mode: "absolute";
  x: number;
  y: number;
}>;

/**
 * 親の中でのノードの置かれ方
 * (docs/03「配置の指定」)。
 * 座標を持つのは `absolute` のときだけであることを構造で表す。
 *
 * 指しているのは `.dcmp` のノードが親の中でどう置かれるかで、インスタンスを
 * 置いている最中(`InstancePlacementIndicator`)でも、解決値をラベルのどちら側へ
 * 添えるか(`ResolvedValuePlacement`)でもない。
 */
export type Placement = Readonly<{ mode: "flow" }> | AbsolutePlacement;

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

  /**
   * フローから外れて座標で置かれるか。flex アイテムとして並ばない。
   * 絞り込みを兼ねるのは、座標を動かす操作が絶対配置の枝しか受け取らないため。
   */
  isAbsolute(placement: Placement | undefined): placement is AbsolutePlacement {
    return placement?.mode === "absolute";
  },

  /**
   * 座標をずらした配置。
   *
   * 整数へ丸めるのは、画面上の 1px 未満の差(倍率の割り戻しで出る)をドキュメントへ
   * 残さないため。長さを `AxisLength.create` が丸めているのと同じ理由で、同じ操作
   * (ドラッグ)から来る値がサイズと座標で違う粒度になるのを避ける。
   *
   * `AxisLength` と違って 0 で下限を切らないのは、負の座標が親からはみ出した位置と
   * して成立するため(長さの負は存在しない)。
   *
   * @param placement ずらす前の配置
   * @param delta 動かす量。ドキュメント上の px（画面上の量なら倍率で割り戻してから渡す）
   * @returns 座標をずらした配置
   */
  moveBy(placement: AbsolutePlacement, delta: Offset): AbsolutePlacement {
    return {
      ...placement,
      x: Math.round(placement.x + delta.x),
      y: Math.round(placement.y + delta.y),
    };
  },

  /**
   * 配置を props の編集へ戻す（`fromProps` の逆向きのうち、座標の 2 prop）。
   *
   * `placement` prop を含まないのは、動かす相手が既に絶対配置だから
   * （フローのノードを絶対配置へ変える操作はまだ無い）。prop 名を知っているのが
   * このモジュールだけ、という状態を保つために編集の側もここが組み立てる。
   *
   * @param placement 書き戻す配置
   * @returns 横と縦の座標を設定する編集 2 件
   */
  toPropEdits(placement: AbsolutePlacement): readonly PropEdit[] {
    return [PropEdit.set(["x"], placement.x), PropEdit.set(["y"], placement.y)];
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

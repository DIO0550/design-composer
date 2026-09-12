import type { AxisResize } from "@/domains/dcmp/axis-length";
import type { Props } from "@/domains/dcmp/node";
import type { Axis } from "@/domains/unit/axis";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import type { Option } from "@/utils/Option";

/**
 * 絶対配置の子が、親の長さの変化にどう追従するか(docs/03「配置の指定」の追従の表)。
 * Figma の `constraints` から借りた語で、このリポジトリでは **`placement: absolute` の
 * 子が親のサイズ変更に追従する側**を指す。
 *
 * 値の出どころもここに置き、スキーマ側が `Object.values` で引く（`Layouts` /
 * `CssDirections` も同じ向き）。
 */
export const Constraints = {
  Min: "min",
  Max: "max",
  Center: "center",
  Stretch: "stretch",
  Scale: "scale",
} as const;

/** 追従の仕方。1 軸につき 1 つ持つ。 */
export type Constraint = ValueOf<typeof Constraints>;

/**
 * その軸の追従の仕方を持つ prop 名 (docs/03「配置の指定」)。
 * 綴りを知っているのはここだけで、消費側は prop 名を持たない。
 */
const ConstraintProps = {
  width: "constraintX",
  height: "constraintY",
} as const satisfies Readonly<Record<Axis, "constraintX" | "constraintY">>;

export const Constraint = {
  /**
   * props から 1 軸ぶんを読む。
   *
   * `Placement.fromProps` の可否に混ぜると、綴りが 1 つ不正なだけで座標ごと描画を失う。
   *
   * @param props 読み取り元の props (デフォルト解決済みでなくてよい)
   * @param axis どちらの軸の追従を読むか
   * @returns 追従の仕方。未設定・語彙に無い綴りのときは `none`
   *   (不正な値そのものは `DesignDocument.collectErrors` がエラー一覧に出す)
   */
  fromProps(props: Props, axis: Axis): Option<Constraint> {
    return ArrayEx.findEqual(
      Object.values(Constraints),
      props[ConstraintProps[axis]],
    );
  },

  /**
   * 親の長さが変わったあとの、子のその軸方向の位置。
   *
   * 書き戻す側 (`Placement` / `AxisLength`) が自分の規則で丸める。
   *
   * @param constraint その軸の追従の仕方
   * @param offset 変更前の位置 (親の始点からの距離)
   * @param resize 親のその軸の長さの変化
   * @returns 追従したあとの位置。倍率が決まらない (変更前が 0) `scale` では変えない
   */
  offsetAfter(
    constraint: Constraint,
    offset: number,
    resize: AxisResize,
  ): number {
    const growth = resize.after - resize.before;
    switch (constraint) {
      case Constraints.Min:
      case Constraints.Stretch:
        return offset;
      case Constraints.Max:
        return offset + growth;
      case Constraints.Center:
        return offset + growth / 2;
      case Constraints.Scale:
        // 変更前が 0 だと倍率が決まらないので、そのときは変えない
        return resize.before === 0
          ? offset
          : offset * (resize.after / resize.before);
    }
  },

  /**
   * 親の長さが変わったあとの、子のその軸方向の長さ。
   *
   * @param constraint その軸の追従の仕方
   * @param length 変更前の長さ
   * @param resize 親のその軸の長さの変化
   * @returns 追従したあとの長さ。長さを変えない追従 (`min` / `max` / `center`) と、
   *   倍率が決まらない `scale` では変えない
   */
  lengthAfter(
    constraint: Constraint,
    length: number,
    resize: AxisResize,
  ): number {
    const growth = resize.after - resize.before;
    switch (constraint) {
      case Constraints.Min:
      case Constraints.Max:
      case Constraints.Center:
        return length;
      case Constraints.Stretch:
        return length + growth;
      case Constraints.Scale:
        // 変更前が 0 だと倍率が決まらないので、そのときは変えない
        return resize.before === 0
          ? length
          : length * (resize.after / resize.before);
    }
  },
} as const;

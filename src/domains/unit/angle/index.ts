import { NumberEx } from "@/utils/NumberEx";

/**
 * 向きを表す角度。度で表した時計回りの量（y が下向きの画面の座標で見た時計回り。CSS の
 * `rotate()` と同じ向き）。
 *
 * 値域を型で閉じないのは、どの実数も正当な角度だから（360 以上・負の値も 1 回りと余りとして
 * 意味が決まる）。
 */
export type Angle = number;

/** 向きの足し引きで出た端数を落とす、度の小数点以下の桁数（`roundToMicrodegree`）。 */
const DegreeDigits = { fractionDigits: 6 } as const;

export const Angle = {
  /** 1 回りの角度。これの倍数だけ回ったものは、回っていないものと同じ向きになる。 */
  FullTurn: 360,

  /**
   * 回っていないものと同じ向きになるか。
   *
   * @param angle 判定する角度
   * @returns 360 の倍数（0 を含む）なら `true`
   */
  isWholeTurns(angle: Angle): boolean {
    return angle % Angle.FullTurn === 0;
  },

  /**
   * 角度を小数点以下 6 桁へ丸める。足し引きで出た浮動小数点の端数（0.1 + 0.2 の
   * 0.30000000000000004）を落とす。
   *
   * 祖先の角度の合計、合計どうしの差に端数が残ると、360 度の倍数の判定（`isWholeTurns`）を
   * 外し、書く角度にも端数が出る（-0.1 度・-0.2 度・0.3 度の合計が 0 にならないなど）。
   * 1e-6 度は半径 10,000px でも約 1.7e-4px しか動かさないので、見た目を変えずに端数だけを落とせる。
   * 整数へ丸めないのは、端数のある角度（12.5 度など）をそのまま保つため。
   *
   * @param angle 丸める角度
   * @returns 小数点以下 6 桁へ四捨五入した角度。6 桁以内の角度はそのまま
   */
  roundToMicrodegree(angle: Angle): Angle {
    return NumberEx.round(angle, DegreeDigits);
  },

  /**
   * 角度の合計を小数点以下 6 桁へ丸めたもの。
   *
   * 1 つ足すごとに丸めないのは、6 桁より細かい角度どうし（0.0000004 + 0.0000004）だと
   * 足す回数（入れ子の深さ）で合計が変わるから。
   *
   * @param angles 足し合わせる角度の並び
   * @returns 合計を `roundToMicrodegree` へ通した角度。空の並びなら 0
   */
  sum(angles: readonly Angle[]): Angle {
    return Angle.roundToMicrodegree(
      angles.reduce((total, angle) => total + angle, 0),
    );
  },
} as const;

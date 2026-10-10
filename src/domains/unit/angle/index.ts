/**
 * 向きを表す角度。度で表した時計回りの量（y が下向きの画面の座標で見た時計回り。CSS の
 * `rotate()` と同じ向き）。
 *
 * 値域を型で閉じないのは、どの実数も正当な角度だから（360 以上・負の値も 1 回りと余りとして
 * 意味が決まる）。
 */
export type Angle = number;

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
} as const;

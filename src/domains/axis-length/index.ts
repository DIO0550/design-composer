import type { Axis } from "@/domains/css-direction";

/**
 * 軸とその方向の長さ(px)。
 * 長さだけでは何の大きさか決まらず、軸だけでは大きさが決まらないため対で持つ。
 */
export type AxisLength = Readonly<{
  axis: Axis;
  length: number;
}>;

export const AxisLength = {
  /**
   * 長さを 0 以上の整数へ丸めて組み立てる。
   *
   * 負の長さはその軸の大きさとして存在しない。整数へ丸めるのは、
   * 画面上の 1px 未満の差(倍率の割り戻しで出る)をドキュメントへ残さないため。
   */
  create(axis: Axis, length: number): AxisLength {
    return { axis, length: Math.max(0, Math.round(length)) };
  },
} as const;

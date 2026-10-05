import type { Props } from "@/domains/dcmp/node";

/**
 * ノードの向き（docs/03「回転」）。度で表した時計回りの角度で、中心を軸に回る。
 *
 * 値域を型で閉じないのは、どの実数も正当な角度だから（360 以上・負の値も書ける）。
 */
export type Rotation = number;

/** 1 回りの角度。これの倍数だけ回ったものは、回っていないものと同じ向きに描かれる。 */
const FullTurn = 360;

export const Rotation = {
  /** 書かれていないノードに効く向き（回っていない）。 */
  Default: 0,

  /**
   * props から向きを読む。
   *
   * @param props 読み取り元の props（デフォルト解決済みでなくてよい）
   * @returns 書かれている角度。未設定・数値でない値・有限でない値（ファイル由来の不正な綴り。
   *   JSON の `1e400` は Infinity として読まれる）のときは既定（`Default`）
   */
  fromProps(props: Props): Rotation {
    const rotation = props.rotation;
    return typeof rotation === "number" && Number.isFinite(rotation)
      ? rotation
      : Rotation.Default;
  },

  /**
   * 回っていないものと同じ向きに描かれるか。
   *
   * @param rotation 判定する向き
   * @returns 360 の倍数（0 を含む）なら `true`
   */
  isWholeTurns(rotation: Rotation): boolean {
    return rotation % FullTurn === 0;
  },
} as const;

import type { Props } from "@/domains/dcmp/node";
import type { Angle } from "@/domains/unit/angle";

/**
 * ノードの `rotation` prop の解釈（docs/03「回転」）。中心を軸に、書かれた角度だけ時計回りに
 * 回る。
 *
 * 角度そのものは `unit/angle` の `Angle` で、ここが持つのは `.dcmp` に書かれた値をどう読むか
 * だけ。型を持たないのは、読んだ結果が `Angle` と同じ構造で、別の型を立てても何も防げないため。
 */
export const Rotation = {
  /** 書かれていないノードに効く角度（回っていない）。 */
  Default: 0,

  /**
   * props から角度を読む。
   *
   * @param props 読み取り元の props（デフォルト解決済みでなくてよい）
   * @returns 書かれている角度。未設定・数値でない値・有限でない値（ファイル由来の不正な綴り。
   *   JSON の `1e400` は Infinity として読まれる）のときは既定（`Default`）
   */
  fromProps(props: Props): Angle {
    const rotation = props.rotation;
    return typeof rotation === "number" && Number.isFinite(rotation)
      ? rotation
      : Rotation.Default;
  },
} as const;

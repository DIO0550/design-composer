import { PropEdit } from "@/domains/dcmp/node";
import type { Axis } from "@/domains/unit/axis";
import { Option } from "@/utils/Option";

/**
 * 軸とその方向の長さ(px)。
 * 長さだけでは何の大きさか決まらず、軸だけでは大きさが決まらないため対で持つ。
 */
export type AxisLength = Readonly<{
  axis: Axis;
  length: number;
}>;

/**
 * 1 回のリサイズで書き換える長さ。**空にはならない。**
 *
 * 素の配列にすると「0 軸のリサイズ」が書けてしまい、書き込む側が 1 度も編集を
 * 通らずに成功を返す（`DesignDocument.resize`）。掴んだものを直和で閉じているのに
 * 境界で緩めないよう、先頭が必ずある形にする。
 */
export type AxisLengths = readonly [AxisLength, ...AxisLength[]];

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

  /**
   * 並びの中からその軸のものを探す。
   *
   * @param lengths 探す先の並び
   * @param axis 探す軸
   * @returns その軸の長さ。並びに無ければ `none`
   */
  find(lengths: readonly AxisLength[], axis: Axis): Option<AxisLength> {
    return Option.fromNullable(lengths.find((length) => length.axis === axis));
  },

  /**
   * ノードの props へ書き込む形。軸の綴りがそのまま prop の名前になる。
   *
   * ここに置くのは `Placement.toPropEdits`（座標を props へ書く形）と同じ理由で、
   * どの prop に書くかはその値自身の性質だから。書き込む側（`DesignDocument`）に
   * 直書きすると、同じ変換が呼び出し側ごとに散る。
   *
   * @param size 書き込む軸と長さ
   * @returns その軸の prop を長さにする編集
   */
  toPropEdit(size: AxisLength): PropEdit {
    return PropEdit.set([size.axis], size.length);
  },
} as const;

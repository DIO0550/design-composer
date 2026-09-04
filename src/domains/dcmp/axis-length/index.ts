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

/**
 * ある軸の長さが変わったこと。
 *
 * 前後を対で持つのは、変化した量も倍率も片方だけでは決まらないため
 * (絶対配置の子の追従は差分と倍率の両方を使う → `Constraint`)。
 */
export type AxisResize = Readonly<{
  axis: Axis;
  before: number;
  after: number;
}>;

export const AxisResize = {
  /**
   * 長さが実際に変わったときだけ組み立てる。
   *
   * 前後が同じときに `none` を返すのは、消費側 (追従) が「変化があった軸」だけを
   * 受け取れるようにするため。構造的な型なので値そのものは直接も書ける (テストは
   * そうしている) が、変化があったかを判定する入口はここに 1 つだけ置く。
   * オブジェクト引数にするのは、同じ型の `before` / `after` を位置で並べると
   * 取り違えても型エラーにならないため。
   *
   * @param lengths 変化した軸と、その前後の長さ
   * @returns 長さの変化。前後が同じなら `none`
   */
  create(lengths: AxisResize): Option<AxisResize> {
    return lengths.before === lengths.after
      ? Option.none
      : Option.some(lengths);
  },
} as const;

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

import type { AxisLengths } from "@/domains/dcmp/axis-length";
import type { Offset } from "@/domains/unit/offset";
import { Option } from "@/utils/Option";

/**
 * 1 回のリサイズで書き込む内容（docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。
 *
 * 始点側の辺（左辺・上辺）から縮めると、反対側の辺をその場に留めるために位置も動く。
 * 長さと位置が別々に届くと Undo 1 回で片方しか戻らないため、対で 1 つの編集にする。
 *
 * `position` は**置き直したあとの位置**で、移動量ではない。ドラッグ中は掴んだ時点からの
 * 総移動量で毎回組み立て直して届くので、移動量にすると 2 件目が今の座標へさらに足されて
 * 二重に動く。
 */
export type ResizeEdit = Readonly<{
  lengths: AxisLengths;
  /** 置き直したあとの位置。終点側の辺だけを掴んだなら `none`（位置は書き換えない）。 */
  position: Option<Offset>;
}>;

export const ResizeEdit = {
  /**
   * 位置を書き換えないリサイズ。終点側の辺・角だけを掴んだときの形。
   *
   * @param lengths 書き込む長さ
   * @returns 長さだけを書き込む編集
   */
  create(lengths: AxisLengths): ResizeEdit {
    return { lengths, position: Option.none };
  },

  /**
   * 位置も書き換えるリサイズ。始点側の辺を掴んだ軸があるときの形。
   *
   * @param lengths 書き込む長さ
   * @param position 置き直したあとの位置（移動量ではない）
   * @returns 長さと位置を書き込む編集
   */
  placedAt(lengths: AxisLengths, position: Offset): ResizeEdit {
    return { lengths, position: Option.some(position) };
  },
} as const;

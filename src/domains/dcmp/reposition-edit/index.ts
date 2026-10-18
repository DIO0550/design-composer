import type { ChildPlacement } from "@/domains/dcmp/child-placement";
import type { Angle } from "@/domains/unit/angle";
import { Option } from "@/utils/Option";

/**
 * 1 回の置き直しで書き込む内容（docs/06-ui.md「キャンバス直接操作」の移動のうち、絶対配置の
 * ノードの分）。
 *
 * ノード自身の `rotation` は x / y と同じく親の向きを基準に測る値（docs/03「回転」は Figma の
 * `relativeTransform` が含む回転にあたるとし、子は親と一緒に回ったうえで自分の分だけ回る）なので、
 * 向きの違う親へ付け替えると、見た目を保つには座標と一緒に向きも書き換えることになる。座標と
 * 向きが別々に届くと Undo 1 回で片方しか戻らないため、対で 1 つの編集にする。
 *
 * `ChildPlacement` に向きを足さないのは、あちらが `DesignDocument.childPlacementOf` の答え
 * （今どこにいるか）でもあり、「向きは書かない」が答えとして意味を持たないため。
 */
export type RepositionEdit = Readonly<{
  /** 置き直したあとの親と、その親から見た座標。 */
  to: ChildPlacement;
  /** 書き込む自分の向き。向きを書き換えないなら `none`。 */
  rotation: Option<Angle>;
}>;

export const RepositionEdit = {
  /**
   * 向きを書き換えない置き直し。同じ親の中で動かすときと、向きの差が 1 回りの倍数の親へ
   * 付け替えるときの形。
   *
   * @param to 置き直したあとの親と座標
   * @returns 親と座標だけを書き込む編集
   */
  create(to: ChildPlacement): RepositionEdit {
    return { to, rotation: Option.none };
  },

  /**
   * 向きも書き換える置き直し。向きの違う親へ付け替えるときの形。
   *
   * @param to 置き直したあとの親と座標
   * @param rotation 置き直したあとの自分の向き（新しい親の向きを基準にした角度）
   * @returns 親と座標と向きを書き込む編集
   */
  rotatedTo(to: ChildPlacement, rotation: Angle): RepositionEdit {
    return { to, rotation: Option.some(rotation) };
  },
} as const;

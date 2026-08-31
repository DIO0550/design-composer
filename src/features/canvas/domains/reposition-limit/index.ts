import type { AbsolutePlacement } from "@/domains/dcmp/placement";
import { NumberEx } from "@/utils/NumberEx";
import { Option } from "@/utils/Option";

/**
 * 掴んだノードを親の内側に収めたまま置ける、座標の上限（ドキュメント上の px）。
 * 下限は常に親の左上（0, 0）なので、持つのは上限だけ。
 * **`maxX` / `maxY` は 0 以上**（唯一の入口である `fromElement` が床で切る）。
 * `clamp` は上限が負の値を受け取ると負の座標を返すので、この不変条件に依存している。
 *
 * 収める先を**切り取る祖先（artboard）ではなく直近の親**にしているのは、絶対配置の
 * 座標が直近の親を基準にしており、祖先まで遡るとレイアウトの積み上げが要るため。
 * 遡る形は親の付け替え（#388）と一緒に入れる。
 *
 * 保証するのは**直近の親の内側にあること**まで。親自身が artboard から出ていれば、
 * 収めても見えないままになる（それを直すのも #388）。
 */
export type RepositionLimit = Readonly<{ maxX: number; maxY: number }>;

export const RepositionLimit = {
  /**
   * 描かれている要素から実測する。
   *
   * 親の矩形はドキュメントに書かれていない（`hug` / `fill` があるので、大きさは
   * レイアウトを通すまで決まらない）ため、ここでしか決められない。
   *
   * 測るのに `clientWidth` を使い `getBoundingClientRect` を使わないのは、
   * キャンバスの倍率も運んでいる最中のプレビューも CSS の `transform` で効いており、
   * 矩形にはそれが乗るため。`clientWidth` が返すのは transform を無視した**レイアウト
   * 上の px（整数へ丸められる）**で、絶対配置の基準である親の padding box と一致する
   * （コンパイル結果は border を出さないので、padding box は border box と等しい）。
   *
   * DOM の親をそのまま基準にできるのは、コンパイル結果がフローの Box にも artboard にも
   * `position: relative` を出しており（`placementDeclarations`）、直近の親が必ず
   * 絶対配置の基準になるため。
   *
   * @param element 上限を測る、掴まれているノードの要素
   * @returns 座標の上限（縦横とも 0 以上）。木から外れている（親が無い）/ 親の内側の
   *   大きさが 0 なら `none`。後者は**まだ測れていない**ことを表す（レイアウトが効く前や
   *   描かれていない親）。0 を上限として答えると、測れていないだけのノードを
   *   親の左上へ張り付けてしまう
   */
  fromElement(element: Element): Option<RepositionLimit> {
    const parent = element.parentElement;
    if (parent === null) {
      return Option.none;
    }
    // 縦横のどちらかでも 0 なら、その親はまだ描かれていない（片方だけ 0 は起きない）
    const isMeasured = parent.clientWidth > 0 && parent.clientHeight > 0;
    if (!isMeasured) {
      return Option.none;
    }
    return Option.some({
      maxX: Math.max(0, parent.clientWidth - element.clientWidth),
      maxY: Math.max(0, parent.clientHeight - element.clientHeight),
    });
  },

  /**
   * 上限の内側へ収めた配置。
   *
   * 子のほうが親より大きい軸は上限が 0 なので、その軸では親の左上へ揃う。
   *
   * @param limit 収める先の上限
   * @param placement 収める配置
   * @returns 縦横とも 0 以上・上限以下に収まった配置
   */
  clamp(
    limit: RepositionLimit,
    placement: AbsolutePlacement,
  ): AbsolutePlacement {
    return {
      ...placement,
      x: NumberEx.clamp(placement.x, { min: 0, max: limit.maxX }),
      y: NumberEx.clamp(placement.y, { min: 0, max: limit.maxY }),
    };
  },
} as const;

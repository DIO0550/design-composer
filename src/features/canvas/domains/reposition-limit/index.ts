import type { AbsolutePlacement } from "@/domains/dcmp/placement";
import { NumberEx } from "@/utils/NumberEx";
import { Option } from "@/utils/Option";

/**
 * 掴んだノードを親の内側に収めたまま置ける、座標の上限（ドキュメント上の px）。
 * 下限は常に親の左上（0, 0）なので、持つのは上限だけ。
 *
 * 保証するのは**直近の親の内側にあること**まで。親自身が artboard から出ていれば、
 * 収めても見えないままになる（それを直すのは親の付け替え / #388）。
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
   * 矩形にはそれが乗るため。`clientWidth` は transform を無視した**ドキュメント上の
   * px** をそのまま返す。絶対配置の基準が親の padding box であることとも一致する
   * （コンパイル結果は border を出さないので、padding box は border box と等しい）。
   *
   * @param element 上限を測る、掴まれているノードの要素
   * @returns 座標の上限。木から外れている（親が無い）/ 親の内側に大きさが無いなら
   *   `none`（収まる位置が存在せず、収めにいくと必ず (0, 0) へ張り付くため）
   */
  fromElement(element: Element): Option<RepositionLimit> {
    const parent = element.parentElement;
    if (parent === null) {
      return Option.none;
    }
    const hasInside = parent.clientWidth > 0 && parent.clientHeight > 0;
    if (!hasInside) {
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

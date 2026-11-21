import { Option } from "@/utils/Option";

/**
 * 要素の実測。キャンバスに描かれた要素に限らず、ref で掴んだ要素（キャンバスの器など）も測る。
 *
 * 名前で要素を引く `CanvasDom` に置かないのは、測ることが要素の引き方に依らないため。長さを
 * 当てて測る `CanvasDom.layoutSizeFor` を移さないのは、`style` を当てて戻しても安全なことが
 * 「中身は React の管理外」というキャンバスの前提に乗っているため。
 *
 * テストで実測を差し替える理由と差し替え方は、テストヘルパー `src/libs/__tests__/element-measure.ts`
 * の doc にある。
 */
export const ElementMeasure = {
  /**
   * 要素の矩形。位置も大きさもレイアウトはブラウザが行うので実測で取る。
   *
   * 戻り値の型は名前を付けずに書く。測った矩形を受け取る型は使う側の feature が持っており、
   * `libs/` からは import できないため。
   *
   * @param element 測る要素
   * @returns その要素の今の client 座標の矩形
   */
  boundsOf(
    element: Element,
  ): Readonly<{ left: number; top: number; width: number; height: number }> {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  },

  /**
   * 変形（`transform`）を効かせる前の、レイアウトが決めた大きさ。回っている要素の実測
   * （`boundsOf`）は軸に平行な外接矩形になるので、回る前の大きさはこちらで測る。
   *
   * 戻り値の型を名前を付けずに書く理由は `boundsOf` と同じ。
   *
   * @param element 測る要素
   * @returns border を含む幅と高さ（整数へ丸められている）。レイアウトの大きさを持たない
   *   要素（HTML の要素でないもの）は `none`
   */
  layoutSizeOf(
    element: Element,
  ): Option<Readonly<{ width: number; height: number }>> {
    return element instanceof HTMLElement
      ? Option.some({
          width: element.offsetWidth,
          height: element.offsetHeight,
        })
      : Option.none;
  },
} as const;

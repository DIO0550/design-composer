/**
 * 要素自身から根へ向かう並び。
 *
 * @param element 起点の要素
 * @returns 先頭が `element`、末尾が根の要素になる並び
 */
function selfAndAncestors(element: Element): readonly Element[] {
  const parent = element.parentElement;
  return parent === null ? [element] : [element, ...selfAndAncestors(parent)];
}

/** DOM 要素の性質を答える汎用操作。 */
export const ElementEx = {
  /**
   * その要素が文字を打ち込める種類の要素か（入力欄・複数行入力欄・編集可能な要素）。
   *
   * @param target 調べるイベントの対象。対象が無ければ `null`
   * @returns `input`（`type` を問わず、チェックボックスも含む）・`textarea`・編集可能な要素
   *   なら true。要素でなければ false
   */
  isTextEditable(target: EventTarget | null): boolean {
    if (target instanceof HTMLInputElement) {
      return true;
    }
    if (target instanceof HTMLTextAreaElement) {
      return true;
    }
    return target instanceof HTMLElement && target.isContentEditable;
  },

  /**
   * その要素が選択肢から値を選ぶ場所（選択欄）か。
   *
   * どこまでを通すかを決めるのは呼び出し側で、ここは要素の性質だけを答える。
   *
   * @param target 調べるイベントの対象。対象が無ければ `null`
   * @returns `select` 要素なら true
   */
  isSelectControl(target: EventTarget | null): boolean {
    return target instanceof HTMLSelectElement;
  },

  /**
   * 自身から根へ向かって辿り、その属性を持つ要素の値を通り道の順に並べる。
   *
   * @param target 辿り始めるイベントの対象
   * @param attribute 値を読む属性の名前
   * @returns 自身に近い順の属性値。属性を持たない要素は飛ばす。要素でなければ通り道が
   *   無いので空
   */
  attributeValuesToRoot(
    target: EventTarget,
    attribute: string,
  ): readonly string[] {
    if (!(target instanceof Element)) {
      return [];
    }
    return selfAndAncestors(target)
      .map((element) => element.getAttribute(attribute))
      .filter((value): value is string => value !== null);
  },
} as const;

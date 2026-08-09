/** 要素自身から根へ向かう並び。 */
function selfAndAncestors(element: Element): readonly Element[] {
  const parent = element.parentElement;
  return parent === null ? [element] : [element, ...selfAndAncestors(parent)];
}

/** DOM 要素の性質を答える汎用操作。 */
export const ElementEx = {
  /**
   * その要素が文字を打ち込める場所か（入力欄・複数行入力欄・編集可能な要素）。
   *
   * 受け取るのが `EventTarget` なのは `attributeValuesToRoot` と同じ理由で、
   * イベントの発火元が要素とは限らないため。要素でなければ打ち込めないので偽になる。
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
   * 自身から根へ向かって辿り、その属性を持つ要素の値を通り道の順に並べる。
   *
   * 受け取るのが `EventTarget` なのは、イベントの発火元が要素とは限らないため
   * （document / window も同じ型で届く）。要素でなければ通り道が無いので空になる。
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

/** 要素自身から根へ向かう並び。 */
function selfAndAncestors(element: Element): readonly Element[] {
  const parent = element.parentElement;
  return parent === null ? [element] : [element, ...selfAndAncestors(parent)];
}

export const ElementEx = {
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

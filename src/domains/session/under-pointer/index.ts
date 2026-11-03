import type { SelectionDig } from "@/domains/session/selection-dig";

/**
 * キャンバスのポインタの下にあるものを、どの深さで読むか（docs/06-ui.md「キャンバスのクリッ
 * クが選ぶ階層」）。`names` はポインタの下から外へ辿った名前（内→外。末尾は artboard）、
 * `dig` は押し方から決まった掘る量。
 *
 * 名前の並びだけでは選ぶものが決まらず、どの深さで読むかまで揃って初めて決まるので、
 * `dig` を同じ型に含めている。
 */
export type UnderPointer = Readonly<{
  names: readonly string[];
  dig: SelectionDig;
}>;

export const UnderPointer = {
  /**
   * ポインタの下にあるものを、掘る量と組にする。
   *
   * @param names ポインタの下から外へ辿った名前（内→外）
   * @param dig 押し方から決まった掘る量
   * @returns ポインタの下にあるものと掘る量の組
   */
  create(names: readonly string[], dig: SelectionDig): UnderPointer {
    return { names, dig };
  },

  /**
   * 2 つが同じものを同じ深さで読むか。
   *
   * @param a 比べるもの
   * @param b 比べるもの
   * @returns 名前の並びと掘る量がどちらも同じなら真
   */
  equals(a: UnderPointer, b: UnderPointer): boolean {
    const isSameNames =
      a.names.length === b.names.length &&
      a.names.every((name, index) => name === b.names[index]);
    return isSameNames && a.dig === b.dig;
  },
} as const;

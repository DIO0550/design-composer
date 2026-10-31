import type { SelectionDig } from "@/domains/session/selection-dig";

/**
 * ポインタが今キャンバスのどこを指しているか（docs/06-ui.md「キャンバス直接操作」の、選択
 * しているだけのときの Alt / Option の距離の相手を決める材料）。
 *
 * - `outside`: キャンバスの外
 * - `nothing`: キャンバスの中で、artboard の枠の外（空き領域・見出し・リサイズハンドル）
 * - `on-frame`: artboard の枠の上。`names` は指している位置から外へ辿った名前（内→外。
 *   末尾は artboard）、`dig` はその時点の押し方から決まった掘る量
 */
export type Pointing =
  | Readonly<{ kind: "outside" }>
  | Readonly<{ kind: "nothing" }>
  | Readonly<{
      kind: "on-frame";
      names: readonly string[];
      dig: SelectionDig;
    }>;

/** キャンバスの外を指している。 */
const Outside = { kind: "outside" } as const satisfies Pointing;

/** キャンバスの中で、artboard の枠の外を指している。 */
const Nothing = { kind: "nothing" } as const satisfies Pointing;

export const Pointing = {
  Outside,
  Nothing,

  /**
   * artboard の枠の上を指していることにする。
   *
   * @param names 指している位置から外へ辿った名前（内→外）
   * @param dig その時点の押し方から決まった掘る量
   * @returns 枠の上を指している指し先
   */
  create(names: readonly string[], dig: SelectionDig): Pointing {
    return { kind: "on-frame", names, dig };
  },

  /**
   * 2 つの指し先が同じか。
   *
   * @param a 比べる指し先
   * @param b 比べる指し先
   * @returns 種類が同じで、枠の上なら名前の並びと掘る量まで同じなら真
   */
  equals(a: Pointing, b: Pointing): boolean {
    if (a.kind !== "on-frame" || b.kind !== "on-frame") {
      return a.kind === b.kind;
    }
    const isSameNames =
      a.names.length === b.names.length &&
      a.names.every((name, index) => name === b.names[index]);
    return isSameNames && a.dig === b.dig;
  },
} as const;

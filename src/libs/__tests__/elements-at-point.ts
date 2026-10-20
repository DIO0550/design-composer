import type { Offset } from "@/domains/unit/offset";

/**
 * `document.elementsFromPoint` が、点 `at` で引かれたときだけ `stack` を返すようにする。
 * happy-dom は重なりを持たず `elementsFromPoint` も無いので、テストが並びを決めて置く。
 *
 * 点を見ずに並びを返すと、引く側が別の点を渡してもテストが通ってしまうので、`at` と違う点では
 * 何も重なっていない（空の並び）として返す。
 *
 * @param at 並びを置く点（窓の座標）
 * @param stack その点に重なっている要素の並び（手前から）
 */
export function stubElementsAt({
  at,
  stack,
}: Readonly<{ at: Offset; stack: readonly Element[] }>): void {
  Object.defineProperty(globalThis.document, "elementsFromPoint", {
    configurable: true,
    value: (x: number, y: number) =>
      x === at.x && y === at.y ? [...stack] : [],
  });
}

/**
 * `stubElementsAt` で置いた並びを外す。
 */
export function clearElementsAt(): void {
  Reflect.deleteProperty(globalThis.document, "elementsFromPoint");
}

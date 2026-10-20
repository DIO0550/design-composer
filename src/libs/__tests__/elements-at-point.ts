/**
 * その点に重なっている要素の並び（手前から）を、`document.elementsFromPoint` が返すようにする。
 * happy-dom は重なりを持たず `elementsFromPoint` も無いので、テストが並びを決めて置く。
 */
export function stubElementsAt(stack: readonly Element[]): void {
  Object.defineProperty(globalThis.document, "elementsFromPoint", {
    configurable: true,
    value: () => [...stack],
  });
}

/**
 * `stubElementsAt` で置いた並びを外す。
 */
export function clearElementsAt(): void {
  Reflect.deleteProperty(globalThis.document, "elementsFromPoint");
}

/**
 * キャンバスの要素に「描かれた大きさ」を持たせる。
 *
 * happy-dom はレイアウトを行わず `clientWidth` / `clientHeight` を常に 0 で返すため、
 * そのままでは**親の内側にどれだけ余地があるか**が決まらない。差し替えるのは
 * ブラウザが行う測定だけで、その大きさから何が決まるかは実物のドメインが答える
 * （`RepositionLimit`）（rules/testing.md「プロセス外・制御不能な境界」）。
 *
 * `getBoundingClientRect` を差し替える `drawnAt`（components/artboard-canvas の
 * `__tests__/setup.tsx`）と別に置くのは、見ている箱が違うため。あちらは client 座標の
 * 矩形（キャンバスの倍率が乗る）で、こちらは transform を無視した内側の大きさ。
 *
 * @param element 大きさを持たせる要素
 * @param size その要素が描かれていることにする内側の大きさ
 * @returns 測定を差し替えたあとの、同じ要素
 */
export function measuredAs<T extends Element>(
  element: T,
  size: Readonly<{ width: number; height: number }>,
): T {
  Object.defineProperty(element, "clientWidth", {
    configurable: true,
    value: size.width,
  });
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: size.height,
  });
  return element;
}

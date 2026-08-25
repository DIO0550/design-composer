import { fireEvent } from "@testing-library/react";

/**
 * ポインタ操作。キャンバスのドラッグ（`features/canvas`）と、左ペインの並べ替え
 * （`components/nested-row-list` / `features/sidebar`）の両方が同じ操作を要るため、
 * 横断層に置いて共有する。
 *
 * どこを押した・どこへ入った、という DOM の話しか持たない（座標の意味づけは
 * 呼び出し側が持つ）。
 */

/** 1 本の指 / 1 つのマウスによる操作として扱う。 */
const PointerId = 1;

/** 画面上の位置。 */
export type PointerPoint = Readonly<{ x: number; y: number }>;

export function pressPointer(element: Element, at: PointerPoint): void {
  fireEvent.pointerDown(element, {
    pointerId: PointerId,
    clientX: at.x,
    clientY: at.y,
  });
}

export function movePointer(element: Element, to: PointerPoint): void {
  fireEvent.pointerMove(element, {
    pointerId: PointerId,
    clientX: to.x,
    clientY: to.y,
  });
}

export function releasePointer(element: Element, at: PointerPoint): void {
  fireEvent.pointerUp(element, {
    pointerId: PointerId,
    clientX: at.x,
    clientY: at.y,
  });
}

/**
 * ポインタがその要素へ入ったことにする。
 *
 * `pointerOver` ではなく `pointerEnter` を撃つ。`pointerOver` は `relatedTarget` を
 * 付けないと React が「文書の外から入った」と解釈して**祖先にも enter を配り**、
 * 付けると happy-dom では**どこにも届かなくなる**（実測）。`pointerEnter` は
 * 狙った要素にだけ正確に届く。
 *
 * @param element 入った先の要素
 */
export function enterPointer(element: Element): void {
  fireEvent.pointerEnter(element, { pointerId: PointerId });
}

/**
 * ポインタがその要素から出たことにする。
 *
 * `pointerEnter` と対で、React が合成する enter / leave に合わせて撃つ
 * （生の `dispatchEvent` では React のリスナーへ届かない）。
 *
 * @param element 出た元の要素
 */
export function leavePointer(element: Element): void {
  fireEvent.pointerLeave(element, { pointerId: PointerId });
}

/** 掴んで運んで離す、までを 1 つの操作として起こす。 */
export function drag(
  element: Element,
  movement: Readonly<{ from: PointerPoint; to: PointerPoint }>,
): void {
  pressPointer(element, movement.from);
  movePointer(element, movement.to);
  releasePointer(element, movement.to);
}

/**
 * 行を掴んで別の行の上まで運び、そこで離す（並べ替えの 1 操作）。
 *
 * 離すのを器（`<ul>`）へ撃つのは、行から離した通知が器までバブルするのを
 * そのまま使っているため（実装が受けているのは器の側）。
 *
 * @param movement 掴む行・運ぶ先の行・離す通知を受ける器
 */
export function dragRow(
  movement: Readonly<{ from: Element; to: Element; group: Element }>,
): void {
  pressPointer(movement.from, { x: 0, y: 0 });
  enterPointer(movement.to);
  releasePointer(movement.group, { x: 0, y: 0 });
}

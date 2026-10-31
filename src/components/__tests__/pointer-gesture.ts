import { fireEvent } from "@testing-library/react";
import { type PointerButton, PointerButtons } from "@/libs/dom-event";

/**
 * ポインタ操作。キャンバスのドラッグ（`features/editor/features/canvas`）と、左ペイン・
 * タブ列の並べ替え（`components/nested-row-list` / `features/editor/features/sidebar` /
 * `components/tab-bar`）のどれもが同じ操作を要るため、横断層に置いて共有する。
 *
 * どこを押した・どこへ入った、という DOM の話しか持たない（座標の意味づけは
 * 呼び出し側が持つ）。
 */

/**
 * 1 本の指 / 1 つのマウスによる操作として扱う。ポインタを捕捉したかを確かめる側
 * （`hasPointerCapture`）が同じ id で問うので export する。
 */
export const PointerId = 1;

/** 画面上の位置。 */
export type PointerPoint = Readonly<{ x: number; y: number }>;

/**
 * 操作と一緒に押されている修飾キー（コマンドキーにあたる 2 つと Alt / Option。⌘ と Alt の
 * 同時押しは `meta+alt`）。
 */
export type PressedModifier = "none" | "ctrl" | "meta" | "alt" | "meta+alt";

/**
 * 押されている修飾キーを、イベントが持つ修飾キーの組へ読み替える。
 *
 * @param pressed 押されている修飾キー
 * @returns イベントへ載せる `ctrlKey` / `metaKey` / `altKey`
 */
export function modifierKeysOf(
  pressed: PressedModifier,
): Readonly<{ ctrlKey: boolean; metaKey: boolean; altKey: boolean }> {
  const isMetaHeld = pressed === "meta" || pressed === "meta+alt";
  const isAltHeld = pressed === "alt" || pressed === "meta+alt";
  return {
    ctrlKey: pressed === "ctrl",
    metaKey: isMetaHeld,
    altKey: isAltHeld,
  };
}

/**
 * ポインタを押すイベントを撃つ。押し方の組み合わせは公開する側の関数が決める。
 *
 * @param element 押す要素
 * @param press 押した位置・ボタン・その時点で押されている修飾キー
 */
function firePointerDown(
  element: Element,
  press: Readonly<{
    at: PointerPoint;
    button: PointerButton;
    pressed: PressedModifier;
  }>,
): void {
  fireEvent.pointerDown(element, {
    pointerId: PointerId,
    clientX: press.at.x,
    clientY: press.at.y,
    button: press.button,
    ...modifierKeysOf(press.pressed),
  });
}

/**
 * ポインタを押す。
 *
 * ボタンを渡せるのは、押したボタンで操作が分かれるため（キャンバスは中ボタンだけをパンに
 * する / docs/06-ui.md「キャンバス直接操作」）。**happy-dom の `fireEvent.pointerDown` は
 * `button` をそのまま載せる**（実測）ので、組み立て直す必要は無い。
 *
 * @param element 押す要素
 * @param at 押した位置
 * @param button 押したボタン。既定は主ボタン
 */
export function pressPointer(
  element: Element,
  at: PointerPoint,
  button: PointerButton = PointerButtons.Primary,
): void {
  firePointerDown(element, { at, button, pressed: "none" });
}

/**
 * 修飾キーを押しながら、主ボタンでポインタを押す。
 *
 * `pressPointer` の引数に足さないのは、ボタンと並べると引数が 4 つになるため（押しながら
 * 掴むのは主ボタンだけなので、ボタンは受け取らない）。
 *
 * @param element 押す要素
 * @param at 押した位置
 * @param pressed 押した時点で押されている修飾キー
 */
export function pressPointerHolding(
  element: Element,
  at: PointerPoint,
  pressed: PressedModifier,
): void {
  firePointerDown(element, {
    at,
    button: PointerButtons.Primary,
    pressed,
  });
}

/**
 * ポインタを動かす。
 *
 * @param element 動かした先の要素
 * @param to 動かした先の位置
 * @param pressed 動かしている間に押されている修飾キー。既定は押していない
 */
export function movePointer(
  element: Element,
  to: PointerPoint,
  pressed: PressedModifier = "none",
): void {
  fireEvent.pointerMove(element, {
    pointerId: PointerId,
    clientX: to.x,
    clientY: to.y,
    ...modifierKeysOf(pressed),
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
 * `pointerOver` ではなく `pointerEnter` を撃つ。`pointerOver` は `relatedTarget` を付けな
 * いと React が「文書の外から入った」と解釈して**祖先にも enter を配り**、付けると
 * happy-dom では**どこにも届かなくなる**（実測）。
 *
 * `pointerEnter` は狙った要素にだけ正確に届く。
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
 * （生の `dispatchEvent` では React のリスナーへ届かない）。React はこれを窓の外へ出たと
 * 読むので、**祖先にも leave が届く**。祖先の中に留まる移動は `leavePointerInto` で起こす。
 *
 * @param element 出た元の要素
 */
export function leavePointer(element: Element): void {
  fireEvent.pointerLeave(element, { pointerId: PointerId });
}

/**
 * ポインタがある要素から別の要素へ移ったことにする。leave が届くのは、移った先を含まない
 * 側の要素だけになる（共通の祖先には届かない）。
 *
 * `pointerOut` を `relatedTarget` 付きで撃つ。`enterPointer` の doc のとおり over は
 * `relatedTarget` を付けると happy-dom でどこにも届かなくなるが、out は付けても届き、React
 * がそこから enter / leave を合成する（実測）。
 *
 * @param from 出た元の要素
 * @param to 移った先の要素
 */
export function leavePointerInto(from: Element, to: Element): void {
  fireEvent.pointerOut(from, { pointerId: PointerId, relatedTarget: to });
}

/**
 * 掴んで運んで離す、までを 1 つの操作として起こす。
 *
 * @param element 掴む要素
 * @param movement 掴んだ位置と離す位置
 * @param button 掴んだボタン。既定は主ボタン
 */
export function drag(
  element: Element,
  movement: Readonly<{ from: PointerPoint; to: PointerPoint }>,
  button: PointerButton = PointerButtons.Primary,
): void {
  pressPointer(element, movement.from, button);
  movePointer(element, movement.to);
  releasePointer(element, movement.to);
}

/**
 * 行を掴んで別の行の上まで運び、そこで離す（並べ替えの 1 操作）。
 *
 * 実装が受けているのは器（`<ul>`）だが、そこへ直接撃つと行から器までのバブルを一度も通さな
 * いことになり、行の側で止められても気づけない。
 *
 * @param movement 掴む行と、運んで離す先の行
 */
export function dragRow(
  movement: Readonly<{ from: Element; to: Element }>,
): void {
  pressPointer(movement.from, { x: 0, y: 0 });
  enterPointer(movement.to);
  releasePointer(movement.to, { x: 0, y: 0 });
}

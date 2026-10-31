import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { SelectionDigs } from "@/domains/session/selection-dig";
import {
  holdAlt,
  releaseAlt,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { Pointing } from "@/features/editor/features/canvas/domains/pointing";
import { Option } from "@/utils/Option";
import { useAltPointing } from "..";

/*
 * Alt / Option を押している間だけ、ポインタの指し先を返す（docs/06-ui.md「キャンバス直接操作」
 * の、選択しているだけのときの Alt / Option の距離）。
 */

/** `row` の上を指している。 */
const OnRow = Pointing.create(["row", "card", "home"], SelectionDigs.NoDeeper);

/** `chip` の上を指している。 */
const OnChip = Pointing.create(
  ["chip", "card", "home"],
  SelectionDigs.NoDeeper,
);

test("指してから Alt を押すと、その指し先が返る", () => {
  const { result } = renderHook(() => useAltPointing());
  act(() => result.current.trackPointer(OnRow));

  holdAlt();

  expect(result.current.pointing).toEqual(Option.some(OnRow));
});

test("Alt を押していない間は、動かしても指し先は返らない", () => {
  const { result } = renderHook(() => useAltPointing());

  act(() => result.current.trackPointer(OnRow));

  expect(result.current.pointing).toEqual(Option.none);
});

test("Alt を離すと指し先は返らなくなる", () => {
  const { result } = renderHook(() => useAltPointing());
  act(() => result.current.trackPointer(OnRow));
  holdAlt();

  releaseAlt();

  expect(result.current.pointing).toEqual(Option.none);
});

test("Alt 以外のキーを押しても、指し先は返らない", () => {
  const { result } = renderHook(() => useAltPointing());
  act(() => result.current.trackPointer(OnRow));

  fireEvent.keyDown(globalThis.document, { code: "ShiftLeft", key: "Shift" });

  expect(result.current.pointing).toEqual(Option.none);
});

test("Alt を押したまま別のキーを押して離しても、指し先は返ったまま", () => {
  const { result } = renderHook(() => useAltPointing());
  act(() => result.current.trackPointer(OnRow));
  holdAlt();

  fireEvent.keyDown(globalThis.document, { code: "KeyA", altKey: true });
  fireEvent.keyUp(globalThis.document, { code: "KeyA", altKey: true });

  expect(result.current.pointing).toEqual(Option.some(OnRow));
});

test("ウィンドウを離れると、指し先は返らなくなる", () => {
  const { result } = renderHook(() => useAltPointing());
  act(() => result.current.trackPointer(OnRow));
  holdAlt();

  fireEvent.blur(globalThis.window);

  expect(result.current.pointing).toEqual(Option.none);
});

test("Alt を押している間に指し先が変わると、新しい指し先が返る", () => {
  const { result } = renderHook(() => useAltPointing());
  act(() => result.current.trackPointer(OnRow));
  holdAlt();

  act(() => result.current.trackPointer(OnChip));

  expect(result.current.pointing).toEqual(Option.some(OnChip));
});

test("Alt を押している間に同じ指し先を伝え直しても、同じ参照が返る", () => {
  const { result } = renderHook(() => useAltPointing());
  act(() => result.current.trackPointer(OnRow));
  holdAlt();
  const before = result.current.pointing;

  act(() =>
    result.current.trackPointer(
      Pointing.create(["row", "card", "home"], SelectionDigs.NoDeeper),
    ),
  );

  expect(result.current.pointing).toBe(before);
});

test("Alt を押したまま keydown が繰り返し届いても、同じ参照が返る", () => {
  const { result } = renderHook(() => useAltPointing());
  act(() => result.current.trackPointer(OnRow));
  holdAlt();
  const before = result.current.pointing;

  holdAlt();

  expect(result.current.pointing).toBe(before);
});

test("入力欄にフォーカスがあるときに Alt を押しても、指し先は返らない", () => {
  const { result } = renderHook(() => useAltPointing());
  const { getByRole } = render(<input type="text" />);
  act(() => result.current.trackPointer(OnRow));

  holdAlt(getByRole("textbox"));

  expect(result.current.pointing).toEqual(Option.none);
});

test("選択欄にフォーカスがあるときに Alt を押しても、指し先は返らない", () => {
  const { result } = renderHook(() => useAltPointing());
  const { getByRole } = render(
    <select>
      <option>fixed</option>
    </select>,
  );
  act(() => result.current.trackPointer(OnRow));

  holdAlt(getByRole("combobox"));

  expect(result.current.pointing).toEqual(Option.none);
});

import { renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { useFirstThenRest } from "../index";

/** 1 件目と 2 件目以降で別の値を返す並びを描く。 */
const setup = () =>
  renderHook(() => useFirstThenRest({ first: "head", rest: "tail" }));

test("初めて呼ぶと 1 件目の値が返る", () => {
  const { result } = setup();

  const value = result.current.next();

  expect(value).toBe("head");
});

test("描き直しを挟んで続けて呼んでも、2 回目からは 2 件目以降の値が返る", () => {
  const { result, rerender } = setup();

  const first = result.current.next();
  rerender();
  const second = result.current.next();
  rerender();
  const third = result.current.next();

  expect([first, second, third]).toEqual(["head", "tail", "tail"]);
});

test("描き直しを待たずに続けて呼んでも、2 回目は 2 件目以降の値が返る", () => {
  const { result } = setup();

  const sequence = result.current;
  const values = [sequence.next(), sequence.next()];

  expect(values).toEqual(["head", "tail"]);
});

test("1 回呼んで 2 件目以降の値になってから区切ると、次はまた 1 件目の値が返る", () => {
  const { result } = setup();

  const first = result.current.next();
  const second = result.current.next();
  result.current.restart();
  const afterRestart = result.current.next();

  expect([first, second, afterRestart]).toEqual(["head", "tail", "head"]);
});

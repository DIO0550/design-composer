import { fireEvent, render } from "@testing-library/react";
import { useCallback } from "react";
import { expect, test } from "vitest";
import { DomListener } from "@/libs/dom-event";
import { useDomListeners } from "../index";

/** document の keydown で受け取ったキーを `received` へ積む器。 */
function DocumentKeyHarness({
  received,
  label,
}: Readonly<{ received: string[]; label: string }>) {
  const collect = useCallback(
    () => [
      DomListener.createOnDocument("keydown", (event) => {
        received.push(`${label}:${event.key}`);
      }),
    ],
    [received, label],
  );
  useDomListeners(collect);
  return <div />;
}

test("描画すると、集めたリスナーがイベントを受け取る", () => {
  const received: string[] = [];
  render(<DocumentKeyHarness received={received} label="a" />);

  fireEvent.keyDown(document, { key: "x" });

  expect(received).toEqual(["a:x"]);
});

test("外れると、集めたリスナーはイベントを受け取らなくなる", () => {
  const received: string[] = [];
  const { unmount } = render(
    <DocumentKeyHarness received={received} label="a" />,
  );
  unmount();

  fireEvent.keyDown(document, { key: "x" });

  expect(received).toEqual([]);
});

test("手続きが変わると、前のリスナーは受け取らず新しいリスナーだけが受け取る", () => {
  const received: string[] = [];
  const { rerender } = render(
    <DocumentKeyHarness received={received} label="a" />,
  );
  rerender(<DocumentKeyHarness received={received} label="b" />);

  fireEvent.keyDown(document, { key: "x" });

  expect(received).toEqual(["b:x"]);
});

test("同じ手続きのまま描き直しても、集め直さない", () => {
  const collected: number[] = [];
  function Harness({ tick }: Readonly<{ tick: number }>) {
    const collect = useCallback(() => {
      collected.push(1);
      return [];
    }, []);
    useDomListeners(collect);
    return <div data-tick={tick} />;
  }
  const { rerender } = render(<Harness tick={0} />);
  rerender(<Harness tick={1} />);

  expect(collected).toHaveLength(1);
});

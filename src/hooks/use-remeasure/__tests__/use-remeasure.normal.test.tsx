import { fireEvent, render } from "@testing-library/react";
import { useCallback } from "react";
import { expect, test } from "vitest";
import { useSubscription } from "@/hooks/use-subscription";
import { Option } from "@/utils/Option";
import { useRemeasure } from "../index";

/** 測り直した回数を `log` へ積む器。 */
function Harness({
  log,
  tick = 0,
}: Readonly<{ log: string[]; tick?: number }>) {
  useRemeasure(() => {
    log.push("remeasure");
  });
  return <div data-tick={tick} />;
}

test("描画すると測る", () => {
  const log: string[] = [];
  render(<Harness log={log} />);

  expect(log).toEqual(["remeasure"]);
});

test("描き直すたびに測り直す", () => {
  const log: string[] = [];
  const { rerender } = render(<Harness log={log} tick={0} />);
  rerender(<Harness log={log} tick={1} />);

  expect(log).toEqual(["remeasure", "remeasure"]);
});

test("ウィンドウの大きさが変わると測り直す", () => {
  const log: string[] = [];
  render(<Harness log={log} />);
  fireEvent(window, new Event("resize"));

  expect(log).toEqual(["remeasure", "remeasure"]);
});

test("外れたあとはウィンドウの大きさが変わっても測り直さない", () => {
  const log: string[] = [];
  const { unmount } = render(<Harness log={log} />);
  unmount();
  fireEvent(window, new Event("resize"));

  expect(log).toEqual(["remeasure"]);
});

test("描画のあとに始める購読より先に測る", () => {
  const log: string[] = [];
  function Ordered() {
    const subscribe = useCallback(() => {
      log.push("subscribe");
      return Option.none;
    }, []);
    useSubscription(subscribe);
    useRemeasure(() => {
      log.push("remeasure");
    });
    return <div />;
  }
  render(<Ordered />);

  expect(log).toEqual(["remeasure", "subscribe"]);
});

test("測る手続きが変わったあとにウィンドウの大きさが変わると、新しい手続きで測る", () => {
  const log: string[] = [];
  function Labeled({ label }: Readonly<{ label: string }>) {
    useRemeasure(() => {
      log.push(label);
    });
    return <div />;
  }
  const { rerender } = render(<Labeled label="a" />);
  rerender(<Labeled label="b" />);
  fireEvent(window, new Event("resize"));

  expect(log).toEqual(["a", "b", "b"]);
});

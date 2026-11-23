import { render } from "@testing-library/react";
import { useCallback } from "react";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { useSubscription } from "../index";

/** 始めた・止めた記録を `log` へ積む購読を張る器。 */
function Harness({
  log,
  topic,
  tick = 0,
}: Readonly<{ log: string[]; topic: string; tick?: number }>) {
  const subscribe = useCallback(() => {
    log.push(`start:${topic}`);
    const stop = () => {
      log.push(`stop:${topic}`);
    };
    return Option.some(stop);
  }, [log, topic]);
  useSubscription(subscribe);
  return <div data-tick={tick} />;
}

test("描画すると購読を始める", () => {
  const log: string[] = [];
  render(<Harness log={log} topic="a" />);

  expect(log).toEqual(["start:a"]);
});

test("外れると購読を止める", () => {
  const log: string[] = [];
  const { unmount } = render(<Harness log={log} topic="a" />);
  unmount();

  expect(log).toEqual(["start:a", "stop:a"]);
});

test("同じ手続きのまま描き直しても、購読を始め直さない", () => {
  const log: string[] = [];
  const { rerender } = render(<Harness log={log} topic="a" tick={0} />);
  rerender(<Harness log={log} topic="a" tick={1} />);

  expect(log).toEqual(["start:a"]);
});

test("手続きが変わると、前の購読を止めてから始め直す", () => {
  const log: string[] = [];
  const { rerender } = render(<Harness log={log} topic="a" />);
  rerender(<Harness log={log} topic="b" />);

  expect(log).toEqual(["start:a", "stop:a", "start:b"]);
});

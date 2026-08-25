import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import {
  dragRow,
  enterPointer,
  leavePointer,
  pressPointer,
  releasePointer,
} from "@/components/__tests__/pointer-gesture";
import { ReorderDrag } from "@/utils/ReorderDrag";
import { useReorderDrag } from "../index";

/** 3 つ並んだだけの器。行の中身は名前を出すだけ。 */
function ReorderHarness({
  onReorder,
}: Readonly<{
  onReorder: (move: Readonly<{ fromIndex: number; toIndex: number }>) => void;
}>) {
  const { drag, rowProps, groupProps } = useReorderDrag(onReorder);

  return (
    <ul data-testid="group" {...groupProps()}>
      {["a", "b", "c"].map((name, index) => (
        <li key={name} data-testid={name} {...rowProps(index)}>
          {name}
          {ReorderDrag.isHeld(drag, index) ? <span>掴んでいる</span> : null}
        </li>
      ))}
    </ul>
  );
}

function renderHarness(): ReturnType<typeof vi.fn> {
  const onReorder = vi.fn();
  render(<ReorderHarness onReorder={onReorder} />);
  return onReorder;
}

test("掴んで別の行の上で離すとその位置への移動が伝わる", () => {
  const onReorder = renderHarness();

  dragRow({ from: screen.getByTestId("a"), to: screen.getByTestId("c") });

  expect(onReorder).toHaveBeenCalledWith({ fromIndex: 0, toIndex: 2 });
});

test("掴んだ行の上で離しても移動は伝わらない", () => {
  const onReorder = renderHarness();

  dragRow({ from: screen.getByTestId("a"), to: screen.getByTestId("a") });

  expect(onReorder).not.toHaveBeenCalled();
});

test("掴まずに行の上を通っても移動は伝わらない", () => {
  const onReorder = renderHarness();

  enterPointer(screen.getByTestId("c"));
  releasePointer(screen.getByTestId("group"), { x: 0, y: 0 });

  expect(onReorder).not.toHaveBeenCalled();
});

test("掴んでいる間はどの行を掴んでいるかが分かる", () => {
  renderHarness();

  pressPointer(screen.getByTestId("b"), { x: 0, y: 0 });

  expect(screen.getByTestId("b").textContent).toBe("b掴んでいる");
});

test("離すと掴んでいない状態へ戻る", () => {
  renderHarness();
  pressPointer(screen.getByTestId("b"), { x: 0, y: 0 });

  releasePointer(screen.getByTestId("group"), { x: 0, y: 0 });

  expect(screen.getByTestId("b").textContent).toBe("b");
});

/*
 * 並びの外で離されると離した通知が届かないので、出た時点で取り消す。
 * これが無いと掴んだままの状態が残り、次にどこかの行へ入っただけで
 * 落ちる先が決まってしまう。
 */
test("並びの外へ出ると掴んでいない状態へ戻る", () => {
  const onReorder = renderHarness();
  pressPointer(screen.getByTestId("a"), { x: 0, y: 0 });

  const group = screen.getByTestId("group");
  leavePointer(group);
  enterPointer(screen.getByTestId("c"));
  releasePointer(group, { x: 0, y: 0 });

  expect(onReorder).not.toHaveBeenCalled();
});

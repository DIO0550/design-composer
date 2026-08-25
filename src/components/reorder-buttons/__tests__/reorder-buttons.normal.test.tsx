import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { ReorderButtons } from "../index";

/**
 * 並びの中の 1 つぶんを描く。
 *
 * @param index その項目が並びの中のどこにいるか
 * @param count 並びに入っているものの数
 * @returns 移動先の通知先
 */
function renderButtons(index: number, count: number): ReturnType<typeof vi.fn> {
  const onMove = vi.fn();
  render(
    <ReorderButtons name="home" placement={{ index, count }} onMove={onMove} />,
  );
  return onMove;
}

test("上へ動かすと1つ前の位置が伝わる", async () => {
  const onMove = renderButtons(1, 3);

  await userEvent.click(screen.getByRole("button", { name: "home を上へ" }));

  expect(onMove).toHaveBeenCalledWith(0);
});

test("下へ動かすと1つ後ろの位置が伝わる", async () => {
  const onMove = renderButtons(1, 3);

  await userEvent.click(screen.getByRole("button", { name: "home を下へ" }));

  expect(onMove).toHaveBeenCalledWith(2);
});

test("並びの先頭では上へ動かすボタンが出ない", () => {
  renderButtons(0, 3);

  expect(screen.queryByRole("button", { name: "home を上へ" })).toBeNull();
});

test("並びの先頭でも下へ動かすボタンは出る", () => {
  renderButtons(0, 3);

  expect(screen.getByRole("button", { name: "home を下へ" })).toBeDefined();
});

test("並びの末尾では下へ動かすボタンが出ない", () => {
  renderButtons(2, 3);

  expect(screen.queryByRole("button", { name: "home を下へ" })).toBeNull();
});

test("並びに1つしか無ければどちらのボタンも出ない", () => {
  renderButtons(0, 1);

  expect(screen.queryAllByRole("button")).toEqual([]);
});

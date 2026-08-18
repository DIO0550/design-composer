import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { StaleCanvasOverlay } from "../index";

/*
 * ファイルが不正な間の重ね（#135）。映っているのが最後に正常だった表示であることを
 * 名乗るバッジと、編集できないことを表す斜線。
 */

test("映っているのが最後に正常だった表示であることを名乗る", () => {
  render(<StaleCanvasOverlay />);

  expect(screen.getByText("最後に正常だった表示")).toBeDefined();
});

test("斜線は読み上げられない", () => {
  // 同じことをバッジが文で伝えるので、斜線は読み上げに出さない
  const { container } = render(<StaleCanvasOverlay />);

  expect(container.querySelector("div")?.getAttribute("aria-hidden")).toBe(
    "true",
  );
});

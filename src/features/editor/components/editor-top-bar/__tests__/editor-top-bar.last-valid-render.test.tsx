import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ElapsedUnits } from "@/features/editor/domains/elapsed";
import { renderTopBar } from "./setup";

test("経過時間を渡すと、映っているのが最後に正常だった表示だと分かる行が出る", () => {
  renderTopBar({ elapsed: { unit: ElapsedUnits.Seconds, count: 4 } });

  expect(screen.getByText("showing last valid render · 4s ago")).toBeDefined();
});

test("分に繰り上がった経過時間は分で出る", () => {
  renderTopBar({ elapsed: { unit: ElapsedUnits.Minutes, count: 2 } });

  expect(screen.getByText("showing last valid render · 2m ago")).toBeDefined();
});

test("時間に繰り上がった経過時間は時間で出る", () => {
  renderTopBar({ elapsed: { unit: ElapsedUnits.Hours, count: 3 } });

  expect(screen.getByText("showing last valid render · 3h ago")).toBeDefined();
});

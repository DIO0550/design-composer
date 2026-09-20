import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderControl } from "./setup";

test("どのセグメントも選ばれていないときは押された状態のセグメントが出ない", () => {
  renderControl([]);

  expect(screen.queryAllByRole("button", { pressed: true }).length).toBe(0);
});

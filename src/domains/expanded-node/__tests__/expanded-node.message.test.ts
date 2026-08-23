import { expect, test } from "vitest";
import { ExpandedNodeError } from "../index";

test("component-not-found は引けなかった部品名を含むメッセージになる", () => {
  expect(
    ExpandedNodeError.message({
      kind: "component-not-found",
      component: "missing-card",
    }),
  ).toBe('component "missing-card" not found');
});

test("circular-component-reference は輪になっていた部品名を含むメッセージになる", () => {
  expect(
    ExpandedNodeError.message({
      kind: "circular-component-reference",
      component: "summary",
    }),
  ).toBe('circular component reference detected at "summary"');
});

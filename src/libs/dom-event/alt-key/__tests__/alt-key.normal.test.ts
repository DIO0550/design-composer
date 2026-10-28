import { expect, test } from "vitest";
import { AltKey } from "../index";

test("Alt / Option が押されていれば押下として扱う", () => {
  expect(AltKey.isHeld({ altKey: true })).toBe(true);
});

test("Alt / Option が押されていなければ押下ではない", () => {
  expect(AltKey.isHeld({ altKey: false })).toBe(false);
});

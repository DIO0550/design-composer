import { expect, test } from "vitest";
import { Angle } from "../index";

test("1 回り回したものは回っていないものと同じ向きになる", () => {
  expect(Angle.isWholeTurns(360)).toBe(true);
});

test("逆向きに 1 回り回したものも回っていないものと同じ向きになる", () => {
  expect(Angle.isWholeTurns(-360)).toBe(true);
});

test("半回り回したものは回っていないものと違う向きになる", () => {
  expect(Angle.isWholeTurns(180)).toBe(false);
});

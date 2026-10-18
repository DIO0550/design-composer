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

test("向きの足し引きで出た端数は丸めると落ちる", () => {
  expect(Angle.roundToMicrodegree(0.1 + 0.2)).toBe(0.3);
});

test("小数点以下 6 桁までの角度は丸めても変わらない", () => {
  expect(Angle.roundToMicrodegree(12.345678)).toBe(12.345678);
});

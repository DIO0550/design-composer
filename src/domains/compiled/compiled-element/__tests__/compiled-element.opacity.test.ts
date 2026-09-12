import { expect, test } from "vitest";
import { setupBoxStyle } from "./element-style-setup";

test("opacity を下げた Box は opacity を出力する", () => {
  expect(setupBoxStyle({ opacity: 0.5 }).opacity).toBe("0.5");
});

test("opacity が 0 の Box も opacity を出力する", () => {
  expect(setupBoxStyle({ opacity: 0 }).opacity).toBe("0");
});

test("opacity が既定のままの Box は宣言を出力しない", () => {
  expect("opacity" in setupBoxStyle({})).toBe(false);
});

test("opacity に既定と同じ値を書いた Box も宣言を出力しない", () => {
  expect("opacity" in setupBoxStyle({ opacity: 1 })).toBe(false);
});

test("取りうる範囲を外れた opacity は丸めずそのまま出力する", () => {
  expect(setupBoxStyle({ opacity: 1.5 }).opacity).toBe("1.5");
});

test("数値でない opacity は宣言を出力しない", () => {
  expect("opacity" in setupBoxStyle({ opacity: "0.5" })).toBe(false);
});

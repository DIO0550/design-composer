import { expect, test } from "vitest";
import { Rotation } from "../index";

test("向きを書いていないノードは回っていない向きとして読まれる", () => {
  expect(Rotation.fromProps({})).toBe(0);
});

test("角度を書いたノードはその角度として読まれる", () => {
  expect(Rotation.fromProps({ rotation: 30 })).toBe(30);
});

test("数値でない向きは回っていない向きとして読まれる", () => {
  expect(Rotation.fromProps({ rotation: "30" })).toBe(0);
});

test("有限でない角度は回っていない向きとして読まれる", () => {
  expect(Rotation.fromProps({ rotation: Number.POSITIVE_INFINITY })).toBe(0);
});

test("1 回り回したものは回っていないものと同じ向きに描かれる", () => {
  expect(Rotation.isWholeTurns(360)).toBe(true);
});

test("逆向きに 1 回り回したものも回っていないものと同じ向きに描かれる", () => {
  expect(Rotation.isWholeTurns(-360)).toBe(true);
});

test("半回り回したものは回っていないものと違う向きに描かれる", () => {
  expect(Rotation.isWholeTurns(180)).toBe(false);
});

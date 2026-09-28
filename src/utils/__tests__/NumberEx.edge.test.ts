import { expect, test } from "vitest";
import { NumberEx } from "../NumberEx";

test("負のちょうど半分の値は 0 に近い側へ丸まる", () => {
  // 10 倍して二進でもちょうど -17.5 になる値を選ぶ。十進で半分に見えても二進で半分からずれる値
  // （`1.005` を 100 倍すると 100.49999…）では、寄る向きではなく誤差で答えが決まる
  expect(NumberEx.round(-1.75, { fractionDigits: 1 })).toBe(-1.7);
});

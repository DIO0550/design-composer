import { expect, test } from "vitest";
import { Elapsed, ElapsedUnits } from "../index";
import { afterSeconds, FROM } from "./setup";

test("4 秒経つと 4 秒として読める", () => {
  expect(Elapsed.create({ from: FROM, to: afterSeconds(4) })).toStrictEqual({
    unit: ElapsedUnits.Seconds,
    count: 4,
  });
});

test("60 秒経つと 1 分に繰り上がる", () => {
  expect(Elapsed.create({ from: FROM, to: afterSeconds(60) })).toStrictEqual({
    unit: ElapsedUnits.Minutes,
    count: 1,
  });
});

test("60 分経つと 1 時間に繰り上がる", () => {
  expect(
    Elapsed.create({ from: FROM, to: afterSeconds(60 * 60) }),
  ).toStrictEqual({ unit: ElapsedUnits.Hours, count: 1 });
});

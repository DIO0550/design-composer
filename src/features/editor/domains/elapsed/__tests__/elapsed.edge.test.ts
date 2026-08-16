import { expect, test } from "vitest";
import { Elapsed, ElapsedUnits } from "../index";
import { afterMilliseconds, afterSeconds, From } from "./setup";

test("1 秒に満たないうちは 0 秒として読める", () => {
  expect(
    Elapsed.create({ from: From, to: afterMilliseconds(999) }),
  ).toStrictEqual({ unit: ElapsedUnits.Seconds, count: 0 });
});

test("59 秒はまだ秒のまま読める", () => {
  expect(Elapsed.create({ from: From, to: afterSeconds(59) })).toStrictEqual({
    unit: ElapsedUnits.Seconds,
    count: 59,
  });
});

test("59 分はまだ分のまま読める", () => {
  expect(
    Elapsed.create({ from: From, to: afterSeconds(59 * 60) }),
  ).toStrictEqual({ unit: ElapsedUnits.Minutes, count: 59 });
});

test("繰り上がったあとの端数は切り捨てる", () => {
  expect(Elapsed.create({ from: From, to: afterSeconds(90) })).toStrictEqual({
    unit: ElapsedUnits.Minutes,
    count: 1,
  });
});

test("終点が起点より前でも 0 秒として読める", () => {
  expect(Elapsed.create({ from: From, to: afterSeconds(-5) })).toStrictEqual({
    unit: ElapsedUnits.Seconds,
    count: 0,
  });
});

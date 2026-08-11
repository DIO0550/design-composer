import { expect, test } from "vitest";
import { Instant } from "@/domains/instant";
import { Elapsed, ElapsedUnits } from "../index";

/** 起点。終点はテストごとにここから進めた時刻を作る。 */
const FROM = Instant.create(1_700_000_000_000);

/** 起点から `milliseconds` ミリ秒だけ進んだ時刻。 */
function afterMilliseconds(milliseconds: number): Instant {
  return Instant.create(FROM.epochMs + milliseconds);
}

test("1 秒に満たないうちは 0 秒として読める", () => {
  expect(
    Elapsed.create({ from: FROM, to: afterMilliseconds(999) }),
  ).toStrictEqual({ unit: ElapsedUnits.Seconds, count: 0 });
});

test("59 秒はまだ秒のまま読める", () => {
  expect(
    Elapsed.create({ from: FROM, to: afterMilliseconds(59 * 1000) }),
  ).toStrictEqual({ unit: ElapsedUnits.Seconds, count: 59 });
});

test("59 分はまだ分のまま読める", () => {
  expect(
    Elapsed.create({ from: FROM, to: afterMilliseconds(59 * 60 * 1000) }),
  ).toStrictEqual({ unit: ElapsedUnits.Minutes, count: 59 });
});

test("繰り上がったあとの端数は切り捨てる", () => {
  expect(
    Elapsed.create({ from: FROM, to: afterMilliseconds(90 * 1000) }),
  ).toStrictEqual({ unit: ElapsedUnits.Minutes, count: 1 });
});

test("終点が起点より前でも 0 秒として読める", () => {
  expect(
    Elapsed.create({ from: FROM, to: afterMilliseconds(-5000) }),
  ).toStrictEqual({ unit: ElapsedUnits.Seconds, count: 0 });
});

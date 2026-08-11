import { expect, test } from "vitest";
import { Instant } from "@/domains/instant";
import { Elapsed, ElapsedUnits } from "../index";

/** 起点。終点はテストごとにここから進めた時刻を作る。 */
const FROM = Instant.create(1_700_000_000_000);

/** 起点から `seconds` 秒だけ進んだ時刻。 */
function after(seconds: number): Instant {
  return Instant.create(FROM.epochMs + seconds * 1000);
}

test("4 秒経つと 4 秒として読める", () => {
  expect(Elapsed.create({ from: FROM, to: after(4) })).toStrictEqual({
    unit: ElapsedUnits.Seconds,
    count: 4,
  });
});

test("60 秒経つと 1 分に繰り上がる", () => {
  expect(Elapsed.create({ from: FROM, to: after(60) })).toStrictEqual({
    unit: ElapsedUnits.Minutes,
    count: 1,
  });
});

test("60 分経つと 1 時間に繰り上がる", () => {
  expect(Elapsed.create({ from: FROM, to: after(60 * 60) })).toStrictEqual({
    unit: ElapsedUnits.Hours,
    count: 1,
  });
});

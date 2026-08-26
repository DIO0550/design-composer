import { expect, test } from "vitest";
import { Instant, InstantSpan } from "../index";

test("2 つの時刻の間隔をミリ秒で答える", () => {
  const span = {
    from: Instant.create(1_700_000_000_000),
    to: Instant.create(1_700_000_004_500),
  };

  expect(InstantSpan.toMilliseconds(span)).toBe(4500);
});

test("同じ時刻どうしの間隔は 0 ミリ秒になる", () => {
  const at = Instant.create(1_700_000_000_000);

  expect(InstantSpan.toMilliseconds({ from: at, to: at })).toBe(0);
});

/*
 * 打ち切らずに負のまま返すのがここの契約。0 で止めるかどうかは読み手側の規則で、
 * `Elapsed` が自分で打ち切っている。ここで打ち切ると、時刻が逆転していることを
 * 呼び出し側が知る手段が無くなる。
 */
test("終点が始点より前なら負のミリ秒を答える", () => {
  const span = {
    from: Instant.create(1_700_000_004_500),
    to: Instant.create(1_700_000_000_000),
  };

  expect(InstantSpan.toMilliseconds(span)).toBe(-4500);
});

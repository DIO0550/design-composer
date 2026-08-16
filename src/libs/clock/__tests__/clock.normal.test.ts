import { afterEach, expect, test, vi } from "vitest";
import { Instant } from "@/domains/instant";
import { Clock } from "../index";

/** 時刻とタイマーを進めるのはテストの側なので、各テストのあとで実物へ戻す。 */
afterEach(() => {
  vi.useRealTimers();
});

const NowEpochMs = Date.parse("2026-08-11T09:00:00.000Z");

test("今の時刻を答える", () => {
  vi.useFakeTimers();
  vi.setSystemTime(NowEpochMs);

  expect(Clock.create().now()).toStrictEqual(Instant.create(NowEpochMs));
});

test("時間が進むと答える時刻も進む", () => {
  vi.useFakeTimers();
  vi.setSystemTime(NowEpochMs);
  const clock = Clock.create();

  vi.advanceTimersByTime(4000);

  expect(clock.now()).toStrictEqual(Instant.create(NowEpochMs + 4000));
});

test("購読すると 1 秒ごとに知らせが届く", () => {
  vi.useFakeTimers();
  const clock = Clock.create();
  const ticks: number[] = [];

  const unsubscribe = clock.subscribeSeconds(() => ticks.push(ticks.length));
  vi.advanceTimersByTime(3000);
  unsubscribe();

  expect(ticks).toHaveLength(3);
});

test("1 秒に満たないうちは知らせが届かない", () => {
  vi.useFakeTimers();
  const clock = Clock.create();
  const ticks: number[] = [];

  const unsubscribe = clock.subscribeSeconds(() => ticks.push(ticks.length));
  vi.advanceTimersByTime(999);
  unsubscribe();

  expect(ticks).toHaveLength(0);
});

test("購読を解除すると知らせが止まる", () => {
  vi.useFakeTimers();
  const clock = Clock.create();
  const ticks: number[] = [];
  const unsubscribe = clock.subscribeSeconds(() => ticks.push(ticks.length));
  vi.advanceTimersByTime(1000);

  unsubscribe();
  vi.advanceTimersByTime(5000);

  expect(ticks).toHaveLength(1);
});

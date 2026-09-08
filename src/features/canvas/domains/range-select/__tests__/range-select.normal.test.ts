import { expect, test } from "vitest";
import { RangeSelect } from "..";

test("押した位置から右下へ広げた範囲は、その 2 点を対角にした矩形になる", () => {
  const range = RangeSelect.extendedTo(RangeSelect.create({ x: 100, y: 60 }), {
    x: 180,
    y: 110,
  });

  expect(RangeSelect.bounds(range)).toEqual({
    left: 100,
    top: 60,
    width: 80,
    height: 50,
  });
});

test("押した位置から左上へ広げても、矩形の左上は小さいほうの点になる", () => {
  const range = RangeSelect.extendedTo(RangeSelect.create({ x: 180, y: 110 }), {
    x: 100,
    y: 60,
  });

  expect(RangeSelect.bounds(range)).toEqual({
    left: 100,
    top: 60,
    width: 80,
    height: 50,
  });
});

test("広げた先を動かしても、掴んだ点は動かない", () => {
  const started = RangeSelect.create({ x: 100, y: 60 });

  const moved = RangeSelect.extendedTo(
    RangeSelect.extendedTo(started, { x: 180, y: 110 }),
    { x: 140, y: 90 },
  );

  expect(RangeSelect.bounds(moved)).toEqual({
    left: 100,
    top: 60,
    width: 40,
    height: 30,
  });
});

test("押しただけで動かしていない範囲は引かれていない", () => {
  expect(RangeSelect.isDrawn(RangeSelect.create({ x: 100, y: 60 }))).toBe(
    false,
  );
});

test("手ぶれの範囲に収まる動きでは引かれていない", () => {
  // 閾値は 4px（`DragThresholdPx`）。斜めに 3px 動いた距離は約 4.24px なので、縦横で分ける
  const range = RangeSelect.extendedTo(RangeSelect.create({ x: 100, y: 60 }), {
    x: 102,
    y: 61,
  });

  expect(RangeSelect.isDrawn(range)).toBe(false);
});

test("閾値を超えて動かした範囲は引かれている", () => {
  const range = RangeSelect.extendedTo(RangeSelect.create({ x: 100, y: 60 }), {
    x: 105,
    y: 60,
  });

  expect(RangeSelect.isDrawn(range)).toBe(true);
});

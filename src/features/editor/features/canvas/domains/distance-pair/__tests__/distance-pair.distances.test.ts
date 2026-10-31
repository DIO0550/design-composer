import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import { Option } from "@/utils/Option";
import { DistancePair, DrawnDistancePair } from "../index";

/*
 * 測る 2 つを矩形に置き換えて、どの向きに線を引くか（docs/06-ui.md「キャンバス直接操作」の
 * 選択しているだけのときの Alt / Option の距離）。線の長さと位置は `facing-distances` が
 * 見るので、ここが見るのはどの向きに線が出るか。
 */

/** 起点（左右 100〜200・上下 100〜150）。 */
const From: CanvasBounds = { left: 100, top: 100, width: 100, height: 50 };

/**
 * 向きごとに線が出ているか。
 *
 * @param distances 向きごとの短い線
 * @returns 同じ形で、線のある向きを真にしたもの
 */
function drawnFacings(distances: FacingDistances) {
  const isDrawn = (pair: keyof FacingDistances) => ({
    start: Option.isSome(distances[pair].start),
    end: Option.isSome(distances[pair].end),
  });
  return { horizontal: isDrawn("horizontal"), vertical: isDrawn("vertical") };
}

test("包む相手の内側の縁までは、上下左右 4 本を引く", () => {
  const distances = DrawnDistancePair.toDistances({
    kind: "within",
    inner: From,
    outer: { left: 0, top: 0, width: 400, height: 300 },
  });

  expect(drawnFacings(distances)).toEqual({
    horizontal: { start: true, end: true },
    vertical: { start: true, end: true },
  });
});

test("包む相手からはみ出した向きには、線を引かない", () => {
  // 左辺が相手の左辺（150）より外にある
  const distances = DrawnDistancePair.toDistances({
    kind: "within",
    inner: From,
    outer: { left: 150, top: 0, width: 250, height: 300 },
  });

  expect(drawnFacings(distances)).toEqual({
    horizontal: { start: false, end: true },
    vertical: { start: true, end: true },
  });
});

test("左右に離れて並ぶ相手までは、離れている向きに 1 本だけ引く", () => {
  const distances = DrawnDistancePair.toDistances({
    kind: "beside",
    from: From,
    to: { left: 260, top: 110, width: 50, height: 30 },
  });

  expect(drawnFacings(distances)).toEqual({
    horizontal: { start: false, end: true },
    vertical: { start: false, end: false },
  });
});

test("上下に離れて並ぶ相手までは、離れている向きに 1 本だけ引く", () => {
  const distances = DrawnDistancePair.toDistances({
    kind: "beside",
    from: From,
    to: { left: 120, top: 10, width: 50, height: 30 },
  });

  expect(drawnFacings(distances)).toEqual({
    horizontal: { start: false, end: false },
    vertical: { start: true, end: false },
  });
});

test("斜めに離れている相手までは、線を引かない", () => {
  const distances = DrawnDistancePair.toDistances({
    kind: "beside",
    from: From,
    to: { left: 260, top: 200, width: 50, height: 30 },
  });

  expect(distances).toEqual(FacingDistances.None);
});

test("一部だけ重なる相手までは、線を引かない", () => {
  const distances = DrawnDistancePair.toDistances({
    kind: "beside",
    from: From,
    to: { left: 180, top: 130, width: 50, height: 50 },
  });

  expect(distances).toEqual(FacingDistances.None);
});

test("親子の関係に無く形が包んでいる相手までは、線を引かない", () => {
  const distances = DrawnDistancePair.toDistances({
    kind: "beside",
    from: From,
    to: { left: 0, top: 0, width: 400, height: 300 },
  });

  expect(distances).toEqual(FacingDistances.None);
});

test("接している相手までは、線を引かない", () => {
  const distances = DrawnDistancePair.toDistances({
    kind: "beside",
    from: From,
    to: { left: 200, top: 110, width: 50, height: 30 },
  });

  expect(distances).toEqual(FacingDistances.None);
});

test("2 つとも測れれば、矩形に置き換えた組になる", () => {
  const outer = { left: 0, top: 0, width: 400, height: 300 };
  const drawn = DistancePair.measure(
    { kind: "within", inner: "row", outer: "card" },
    (name) => Option.some(name === "row" ? From : outer),
  );

  expect(drawn).toEqual(Option.some({ kind: "within", inner: From, outer }));
});

test("どちらかが測れなければ、組にならない", () => {
  const drawn = DistancePair.measure(
    { kind: "beside", from: "row", to: "chip" },
    (name) => (name === "row" ? Option.some(From) : Option.none),
  );

  expect(drawn).toEqual(Option.none);
});

test("矩形が 1 つでも違えば、等しくない", () => {
  const outer = { left: 0, top: 0, width: 400, height: 300 };

  const isEqual = DrawnDistancePair.equals(
    { kind: "within", inner: From, outer },
    { kind: "within", inner: From, outer: { ...outer, width: 401 } },
  );

  expect(isEqual).toBe(false);
});

test("同じ矩形でも、組の種類が違えば等しくない", () => {
  const to = { left: 260, top: 110, width: 50, height: 30 };

  const isEqual = DrawnDistancePair.equals(
    { kind: "within", inner: From, outer: to },
    { kind: "beside", from: From, to },
  );

  expect(isEqual).toBe(false);
});

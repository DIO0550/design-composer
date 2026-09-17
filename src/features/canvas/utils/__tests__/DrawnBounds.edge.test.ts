import { afterEach, expect, test } from "vitest";
import {
  clearDrawn,
  drawNamed,
} from "@/features/canvas/__tests__/canvas-measure";
import { Option } from "@/utils/Option";
import { DrawnBounds } from "../DrawnBounds";

/* 測定の差し替え方と後片付けが要る理由は `canvas-measure` の doc を見る。 */
afterEach(clearDrawn);

test("描かれていない名前は測れない", () => {
  drawNamed("home", { left: 12, top: 34, width: 200, height: 100 });

  expect(DrawnBounds.measure("about")).toEqual(Option.none);
});

test("描かれていない名前は飛ばして、残りで囲む", () => {
  drawNamed("home", { left: 10, top: 20, width: 100, height: 50 });

  expect(DrawnBounds.enclosing(["about", "home"])).toEqual(
    Option.some({ left: 10, top: 20, width: 100, height: 50 }),
  );
});

test("名前が 1 つも描かれていなければ囲む矩形は無い", () => {
  drawNamed("home", { left: 10, top: 20, width: 100, height: 50 });

  expect(DrawnBounds.enclosing(["about", "footer"])).toEqual(Option.none);
});

test("面積を持たないものは、矩形の内側にあっても拾わない", () => {
  // 拾う側を 1 件混ぜて期待値をその 1 件だけの並びにする。`[]` を期待すると
  // 何も拾わない実装でも通る
  drawNamed("collapsed", { left: 100, top: 100, width: 0, height: 0 });
  drawNamed("home", { left: 60, top: 60, width: 40, height: 40 });

  const overlapping = DrawnBounds.collectOverlappingNames(
    ["collapsed", "home"],
    { left: 50, top: 50, width: 200, height: 200 },
  );

  expect(overlapping).toEqual(["home"]);
});

test("描かれていない名前は拾わない", () => {
  drawNamed("home", { left: 60, top: 60, width: 40, height: 40 });

  const overlapping = DrawnBounds.collectOverlappingNames(["about", "home"], {
    left: 50,
    top: 50,
    width: 200,
    height: 200,
  });

  expect(overlapping).toEqual(["home"]);
});

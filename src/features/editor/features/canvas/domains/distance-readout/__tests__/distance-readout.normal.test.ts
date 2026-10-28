import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";
import { DistanceReadout } from "../index";

test("長さは、線が伸びる範囲の長さを倍率で割り戻して最も近い整数にしたもの", () => {
  // 100 / 1.5 = 66.67。丸めずに出す実装なら 66.666…、割り戻さない実装なら 100 が出る
  const line = {
    along: SidePairs.Vertical,
    at: 114,
    span: { min: 120, max: 220 },
  };

  expect(
    Option.unwrap(
      DistanceReadout.create(line, { ...CanvasView.create(), scale: 1.5 }),
    ).length,
  ).toBe(67);
});

test("横に伸びる線も、太さではなく伸びる範囲の長さで測る", () => {
  // 線の太さ（2）で測る実装なら 2 になる
  const line = {
    along: SidePairs.Horizontal,
    at: 114,
    span: { min: 140, max: 170 },
  };

  expect(
    Option.unwrap(DistanceReadout.create(line, CanvasView.create())).length,
  ).toBe(30);
});

test("ドキュメント上の px へ丸めると 0 になる長さは、数値にしない", () => {
  // 画面上は 0.4 離れているので短い線はある。丸めた 0 をそのまま出す実装なら落ちる
  const line = {
    along: SidePairs.Vertical,
    at: 114,
    span: { min: 120, max: 120.4 },
  };

  expect(DistanceReadout.create(line, CanvasView.create())).toEqual(
    Option.none,
  );
});

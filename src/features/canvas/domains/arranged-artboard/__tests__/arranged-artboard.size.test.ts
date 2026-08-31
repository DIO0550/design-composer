import { expect, test } from "vitest";
import { ArrangedArtboard } from "../index";
import { compiledArtboard } from "./setup";

test("並び全体の大きさは、いちばん右下に届く artboard の端まで広がる", () => {
  const arranged = ArrangedArtboard.fromArtboards([
    compiledArtboard("auto", { width: 200, height: 100 }),
    compiledArtboard("placed", { width: 50, height: 40 }, { x: 900, y: 300 }),
  ]);

  // 900 + 50 / 300 + 40。置かれた側のほうが遠いので、幅も高さもそちらで決まる
  expect(ArrangedArtboard.size(arranged)).toEqual({
    width: 950,
    height: 340,
  });
});

test("原点より左上にある artboard があっても、大きさは原点から測る", () => {
  const arranged = ArrangedArtboard.fromArtboards([
    compiledArtboard(
      "placed",
      { width: 200, height: 100 },
      { x: -500, y: -400 },
    ),
  ]);

  // 右下端は -500 + 200 = -300 だが、器は縮まないので 0
  expect(ArrangedArtboard.size(arranged)).toEqual({ width: 0, height: 0 });
});

test("artboard が 1 枚も無ければ大きさは 0 になる", () => {
  expect(ArrangedArtboard.size([])).toEqual({ width: 0, height: 0 });
});

test("artboard が 1 枚も無ければ置き場所も 0 件になる", () => {
  expect(ArrangedArtboard.fromArtboards([])).toEqual([]);
});

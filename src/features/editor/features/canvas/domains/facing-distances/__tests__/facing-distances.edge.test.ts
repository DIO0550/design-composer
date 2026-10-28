import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import { Option } from "@/utils/Option";
import { FacingDistances } from "../index";
import { Moved, Parent } from "./sample-bounds";

test("運んでいるものと重なっている兄弟は相手にならない", () => {
  const overlapping = { left: 60, top: 35, width: 30, height: 10 };

  expect(
    FacingDistances.create({
      moved: Moved,
      parentBounds: Parent,
      siblings: [overlapping],
    }).horizontal.end,
  ).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: 70, max: 200 },
    }),
  );
});

test("親の縁より先にいる兄弟は相手にならない", () => {
  const outside = { left: 210, top: 40, width: 20, height: 10 };

  expect(
    FacingDistances.create({
      moved: Moved,
      parentBounds: Parent,
      siblings: [outside],
    }).horizontal.end,
  ).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: 70, max: 200 },
    }),
  );
});

test("兄弟に接している向きには、兄弟も親の縁も線を引かない", () => {
  const touching = { left: 70, top: 40, width: 20, height: 10 };

  const distances = FacingDistances.create({
    moved: Moved,
    parentBounds: Parent,
    siblings: [touching],
  });

  expect(distances.horizontal.end).toEqual(Option.none);
  expect(distances.horizontal.start).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: 0, max: 50 },
    }),
  );
});

test("親の縁に接している向きには線を引かない", () => {
  const distances = FacingDistances.create({
    moved: { left: 0, top: 40, width: 20, height: 10 },
    parentBounds: Parent,
    siblings: [],
  });

  expect(distances.horizontal.start).toEqual(Option.none);
  expect(distances.horizontal.end).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: 20, max: 200 },
    }),
  );
});

test("親の縁からはみ出した向きに兄弟が無ければ、線を引かない", () => {
  const distances = FacingDistances.create({
    moved: { left: -10, top: 40, width: 20, height: 10 },
    parentBounds: Parent,
    siblings: [],
  });

  expect(distances.horizontal.start).toEqual(Option.none);
  expect(distances.horizontal.end).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: 10, max: 200 },
    }),
  );
});

test("親の縁からはみ出した向きでも、その先にいる兄弟までは線を引く", () => {
  const sibling = { left: -40, top: 40, width: 20, height: 10 };

  expect(
    FacingDistances.create({
      moved: { left: -10, top: 40, width: 20, height: 10 },
      parentBounds: Parent,
      siblings: [sibling],
    }).horizontal.start,
  ).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: -20, max: -10 },
    }),
  );
});

test("兄弟と親の縁が同じ距離なら、親の縁までの線になる", () => {
  // 兄弟までなら、上下に向かい合う範囲 45〜50 の中央 47.5 に引く
  const sibling = { left: 200, top: 45, width: 20, height: 20 };

  expect(
    FacingDistances.create({
      moved: Moved,
      parentBounds: Parent,
      siblings: [sibling],
    }).horizontal.end,
  ).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: 70, max: 200 },
    }),
  );
});

test("親の外にいる向きは手前の縁まで測り、奥の縁まで突き抜けない", () => {
  // 親の上（上下 -20〜-10）にいる。下へ進むと親の上辺 0 に当たり、下辺 100 までは測らない
  expect(
    FacingDistances.create({
      moved: { left: 50, top: -20, width: 20, height: 10 },
      parentBounds: Parent,
      siblings: [],
    }),
  ).toEqual({
    horizontal: { start: Option.none, end: Option.none },
    vertical: {
      start: Option.none,
      end: Option.some({
        along: SidePairs.Vertical,
        at: 60,
        span: { min: -10, max: 0 },
      }),
    },
  });
});

test("端数で数 ULP 外側から重なって見えても、親の縁に外側から接している向きには線を引かない", () => {
  // 下辺は -11.99999999999999 + 12 = 1.0658e-14 で、親の上辺 0 より数 ULP 下にある
  expect(
    FacingDistances.create({
      moved: { left: 50, top: -11.99999999999999, width: 20, height: 12 },
      parentBounds: Parent,
      siblings: [],
    }),
  ).toEqual(FacingDistances.None);
  // 1 離れていれば、親の上辺までの線を引く
  expect(
    FacingDistances.create({
      moved: { left: 50, top: -13, width: 20, height: 12 },
      parentBounds: Parent,
      siblings: [],
    }).vertical.end,
  ).toEqual(
    Option.some({
      along: SidePairs.Vertical,
      at: 60,
      span: { min: -1, max: 0 },
    }),
  );
});

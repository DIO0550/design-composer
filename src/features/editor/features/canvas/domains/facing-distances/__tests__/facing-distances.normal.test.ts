import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import { Option } from "@/utils/Option";
import { FacingDistances } from "../index";
import { Moved, Parent } from "./sample-bounds";

test("兄弟が無ければ、上下左右とも親の縁までの線になる", () => {
  expect(
    FacingDistances.create({
      moved: Moved,
      parentBounds: Parent,
      siblings: [],
    }),
  ).toEqual({
    horizontal: {
      start: Option.some({
        along: SidePairs.Horizontal,
        at: 45,
        span: { min: 0, max: 50 },
      }),
      end: Option.some({
        along: SidePairs.Horizontal,
        at: 45,
        span: { min: 70, max: 200 },
      }),
    },
    vertical: {
      start: Option.some({
        along: SidePairs.Vertical,
        at: 60,
        span: { min: 0, max: 40 },
      }),
      end: Option.some({
        along: SidePairs.Vertical,
        at: 60,
        span: { min: 50, max: 100 },
      }),
    },
  });
});

test("進む向きと直交する向きで重なる兄弟がいれば、親の縁ではなくその兄弟までの線になる", () => {
  const sibling = { left: 100, top: 30, width: 20, height: 20 };

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
      span: { min: 70, max: 100 },
    }),
  );
});

test("同じ向きに兄弟が 2 つあるなら、近いほうまでの線になる", () => {
  const far = { left: 150, top: 30, width: 20, height: 20 };
  const near = { left: 100, top: 30, width: 20, height: 20 };

  expect(
    FacingDistances.create({
      moved: Moved,
      parentBounds: Parent,
      siblings: [far, near],
    }).horizontal.end,
  ).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: 70, max: 100 },
    }),
  );
});

test("進む向きと直交する向きで重ならない兄弟は相手にならず、親の縁までの線になる", () => {
  const offRow = { left: 100, top: 60, width: 20, height: 20 };

  expect(
    FacingDistances.create({
      moved: Moved,
      parentBounds: Parent,
      siblings: [offRow],
    }).horizontal.end,
  ).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 45,
      span: { min: 70, max: 200 },
    }),
  );
});

test("線は、相手と向かい合う範囲の中央に引く", () => {
  // 上下に向かい合う範囲は 45〜50。運んでいるものの中央で引く実装なら 45 になる
  const sibling = { left: 100, top: 45, width: 20, height: 30 };

  expect(
    FacingDistances.create({
      moved: Moved,
      parentBounds: Parent,
      siblings: [sibling],
    }).horizontal.end,
  ).toEqual(
    Option.some({
      along: SidePairs.Horizontal,
      at: 47.5,
      span: { min: 70, max: 100 },
    }),
  );
});

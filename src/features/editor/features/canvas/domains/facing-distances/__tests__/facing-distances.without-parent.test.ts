import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import { Option } from "@/utils/Option";
import { FacingDistances } from "../index";
import { Moved } from "./sample-bounds";

/*
 * 親の縁を候補にせず、渡された相手だけを測る距離（docs/06-ui.md の artboard の移動の
 * Alt / Option の距離）。運んでいるものは左右 50〜70・上下 40〜50。
 */

test("上下左右それぞれ、直交する向きで重なる相手のうち最初に当たるものまでの線になる", () => {
  // 上は遠いほう（上下 -100〜-90）を先に並べ、近いほう（上下 10〜20）を選ぶことも見る
  const farAbove = { left: 50, top: -100, width: 20, height: 10 };
  const nearAbove = { left: 55, top: 10, width: 20, height: 10 };
  const below = { left: 60, top: 80, width: 30, height: 10 };
  const left = { left: 0, top: 45, width: 10, height: 20 };
  const right = { left: 120, top: 30, width: 10, height: 15 };

  expect(
    FacingDistances.createAmong({
      moved: Moved,
      others: [farAbove, nearAbove, below, left, right],
    }),
  ).toEqual({
    horizontal: {
      start: Option.some({
        along: SidePairs.Horizontal,
        at: 47.5,
        span: { min: 10, max: 50 },
      }),
      end: Option.some({
        along: SidePairs.Horizontal,
        at: 42.5,
        span: { min: 70, max: 120 },
      }),
    },
    vertical: {
      start: Option.some({
        along: SidePairs.Vertical,
        at: 62.5,
        span: { min: 20, max: 40 },
      }),
      end: Option.some({
        along: SidePairs.Vertical,
        at: 65,
        span: { min: 50, max: 80 },
      }),
    },
  });
});

test("右にだけ相手がいれば、他の 3 向きには線を引かない", () => {
  const right = { left: 120, top: 30, width: 10, height: 15 };

  expect(
    FacingDistances.createAmong({ moved: Moved, others: [right] }),
  ).toEqual({
    horizontal: {
      start: Option.none,
      end: Option.some({
        along: SidePairs.Horizontal,
        at: 42.5,
        span: { min: 70, max: 120 },
      }),
    },
    vertical: { start: Option.none, end: Option.none },
  });
});

test("直交する向きで接するだけの相手は相手にならない", () => {
  // 左右 70〜80 で、運んでいるものの右辺（70）に接するだけ
  const touchingAbove = { left: 70, top: 0, width: 10, height: 10 };

  expect(
    FacingDistances.createAmong({ moved: Moved, others: [touchingAbove] }),
  ).toEqual(FacingDistances.None);
});

test("運んでいるものと重なっている相手は相手にならず、その先の相手までの線になる", () => {
  const overlapping = { left: 40, top: 30, width: 20, height: 15 };
  const beyond = { left: 50, top: 0, width: 20, height: 10 };

  expect(
    FacingDistances.createAmong({
      moved: Moved,
      others: [overlapping, beyond],
    }).vertical.start,
  ).toEqual(
    Option.some({
      along: SidePairs.Vertical,
      at: 60,
      span: { min: 10, max: 40 },
    }),
  );
});

test("相手に接している向きには線を引かない", () => {
  // 接している相手を飛ばすと、その先の相手（上下 0〜10）までの線になる
  const touching = { left: 50, top: 30, width: 20, height: 10 };
  const beyond = { left: 50, top: 0, width: 20, height: 10 };

  expect(
    FacingDistances.createAmong({
      moved: Moved,
      others: [touching, beyond],
    }).vertical.start,
  ).toEqual(Option.none);
});

test("同じ距離に 2 つあれば、並びが先の相手までの線になる", () => {
  // 先の相手と重なる範囲は左右 50〜55、後の相手とは 65〜70（線の位置で見分ける）
  const first = { left: 45, top: 10, width: 10, height: 10 };
  const second = { left: 65, top: 10, width: 10, height: 10 };

  expect(
    FacingDistances.createAmong({
      moved: Moved,
      others: [first, second],
    }).vertical.start,
  ).toEqual(
    Option.some({
      along: SidePairs.Vertical,
      at: 52.5,
      span: { min: 20, max: 40 },
    }),
  );
});

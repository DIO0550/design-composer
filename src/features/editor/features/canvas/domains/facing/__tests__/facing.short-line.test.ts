import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import { ThinLine } from "@/features/editor/features/canvas/domains/thin-line";
import { Option } from "@/utils/Option";
import { Facing } from "../index";
import { Down } from "./facings";

/** 左上 (0, 0) の、幅 40・高さ 10 の矩形。 */
const From = { left: 0, top: 0, width: 40, height: 10 };

test("短い線は、2 つの間を向かい合う範囲の中央に引く", () => {
  const to = { left: 20, top: 30, width: 100, height: 10 };

  expect(
    Option.map(Facing.shortLineTo(Down, { from: From, to }), ThinLine.toBounds),
  ).toEqual(Option.some({ left: 29, top: 10, width: 2, height: 20 }));
});

test("接している相手には短い線を引かない", () => {
  const touching = { left: 0, top: 10, width: 40, height: 10 };

  expect(Facing.shortLineTo(Down, { from: From, to: touching })).toEqual(
    Option.none,
  );
});

test("重なっている相手には短い線を引かない", () => {
  const overlapping = { left: 0, top: 5, width: 40, height: 10 };

  expect(Facing.shortLineTo(Down, { from: From, to: overlapping })).toEqual(
    Option.none,
  );
});

test("向かい合う範囲が 1 点だけでも、その点に短い線を引く", () => {
  const to = { left: 40, top: 30, width: 100, height: 10 };

  expect(Facing.shortLineTo(Down, { from: From, to })).toEqual(
    Option.some({
      along: SidePairs.Vertical,
      at: 40,
      span: { min: 10, max: 30 },
    }),
  );
});

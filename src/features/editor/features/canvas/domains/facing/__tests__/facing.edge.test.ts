import { expect, test } from "vitest";
import { AxisEnds } from "@/domains/unit/axis";
import { SidePairs } from "@/domains/unit/side";
import { Option } from "@/utils/Option";
import { Facing } from "../index";

const Right: Facing = { pair: SidePairs.Horizontal, end: AxisEnds.End };

test("端数で数 ULP 重なって見えても、接している相手には距離 0 で当たる", () => {
  // 右辺は 0.1 + 0.2 = 0.30000000000000004 で、相手の左辺 0.3 より先にある
  const from = { left: 0.1, top: 0, width: 0.2, height: 10 };
  const to = { left: 0.3, top: 0, width: 10, height: 10 };

  expect(Facing.firstReached(Right, { from, candidates: [to] })).toEqual(
    Option.some(to),
  );
});

test("直交する向きに数 ULP 重なって見えても、接するだけの相手には当たらない", () => {
  // 下辺は 0.1 + 0.2 = 0.30000000000000004 で、相手の上辺 0.3 より下にある
  const from = { left: 0, top: 0.1, width: 10, height: 0.2 };
  const to = { left: 20, top: 0.3, width: 10, height: 10 };

  expect(Facing.firstReached(Right, { from, candidates: [to] })).toEqual(
    Option.none,
  );
});

test("端数で数 ULP 違うだけの同じ距離なら、並びの先に当たる", () => {
  const from = { left: 0, top: 0, width: 10, height: 10 };
  const first = { left: 20.700000000000003, top: 0, width: 5, height: 10 };
  const second = { left: 20.7, top: 0, width: 5, height: 10 };

  expect(
    Facing.firstReached(Right, { from, candidates: [first, second] }),
  ).toEqual(Option.some(first));
});

test("直交する向きに 0.001 だけ重なる相手は、重なっているとして当たる", () => {
  const from = { left: 0, top: 0, width: 10, height: 10 };
  const to = { left: 20, top: 9.999, width: 10, height: 10 };

  expect(Facing.firstReached(Right, { from, candidates: [to] })).toEqual(
    Option.some(to),
  );
});

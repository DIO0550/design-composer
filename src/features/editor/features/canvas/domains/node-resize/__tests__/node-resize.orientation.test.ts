import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { AxisEnds } from "@/domains/unit/axis";
import {
  ResizeGrip as Grip,
  GripOrientations,
  type ResizeGrip,
} from "../index";

/*
 * 掴んだものが画面上で伸び縮みする向き（カーソルの矢印の向き）。
 */

/** 右辺（幅の終点側）を掴んだもの。 */
const RightEdge: ResizeGrip = Grip.create({
  length: AxisLength.create("width", 200),
  end: AxisEnds.End,
});

/** 右下の角を掴んだもの。 */
const BottomRight: ResizeGrip = {
  kind: "both",
  width: { length: AxisLength.create("width", 200), end: AxisEnds.End },
  height: { length: AxisLength.create("height", 100), end: AxisEnds.End },
};

test("回っていないノードの右辺は横に伸び縮みする", () => {
  expect(Grip.orientationOf(RightEdge, 0)).toBe(GripOrientations.Horizontal);
});

test("20 度回したノードの右辺は、45 度より横に近いので横に伸び縮みする", () => {
  expect(Grip.orientationOf(RightEdge, 20)).toBe(GripOrientations.Horizontal);
});

test("30 度回したノードの右辺は、横より 45 度に近いので斜めに伸び縮みする", () => {
  expect(Grip.orientationOf(RightEdge, 30)).toBe(
    GripOrientations.TopLeftToBottomRight,
  );
});

test("45 度回したノードの右辺は左上 - 右下の斜めに伸び縮みする", () => {
  expect(Grip.orientationOf(RightEdge, 45)).toBe(
    GripOrientations.TopLeftToBottomRight,
  );
});

test("横と斜めのちょうど中間（22.5 度）は斜めに寄せる", () => {
  expect(Grip.orientationOf(RightEdge, 22.5)).toBe(
    GripOrientations.TopLeftToBottomRight,
  );
});

test("90 度回したノードの右辺は縦に伸び縮みする", () => {
  expect(Grip.orientationOf(RightEdge, 90)).toBe(GripOrientations.Vertical);
});

test("縦と右上 - 左下の斜めのちょうど中間（112.5 度）は斜めに寄せる", () => {
  expect(Grip.orientationOf(RightEdge, 112.5)).toBe(
    GripOrientations.TopRightToBottomLeft,
  );
});

test("170 度回したノードの右辺は、斜めより横に近いので横に伸び縮みする", () => {
  expect(Grip.orientationOf(RightEdge, 170)).toBe(GripOrientations.Horizontal);
});

test("反時計回りに 45 度回したノードの右辺は右上 - 左下の斜めに伸び縮みする", () => {
  expect(Grip.orientationOf(RightEdge, -45)).toBe(
    GripOrientations.TopRightToBottomLeft,
  );
});

test("1 回り余分に回したノードは、余りの角度ぶんの向きに伸び縮みする", () => {
  expect(Grip.orientationOf(RightEdge, 405)).toBe(
    GripOrientations.TopLeftToBottomRight,
  );
});

test("回っていないノードの右下の角は左上 - 右下の斜めに伸び縮みする", () => {
  expect(Grip.orientationOf(BottomRight, 0)).toBe(
    GripOrientations.TopLeftToBottomRight,
  );
});

test("90 度回したノードの右下の角は右上 - 左下の斜めに伸び縮みする", () => {
  expect(Grip.orientationOf(BottomRight, 90)).toBe(
    GripOrientations.TopRightToBottomLeft,
  );
});

import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { AxisEnds } from "@/domains/unit/axis";
import { ResizeGrip as Grip, type ResizeGrip, Slants } from "../index";

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
  expect(Grip.slantOf(RightEdge, 0)).toBe(Slants.Horizontal);
});

test("20 度回したノードの右辺は、45 度より横に近いので横に伸び縮みする", () => {
  expect(Grip.slantOf(RightEdge, 20)).toBe(Slants.Horizontal);
});

test("30 度回したノードの右辺は、横より 45 度に近いので斜めに伸び縮みする", () => {
  expect(Grip.slantOf(RightEdge, 30)).toBe(Slants.Falling);
});

test("45 度回したノードの右辺は左上 - 右下の斜めに伸び縮みする", () => {
  expect(Grip.slantOf(RightEdge, 45)).toBe(Slants.Falling);
});

test("横と斜めのちょうど中間（22.5 度）は斜めに寄せる", () => {
  expect(Grip.slantOf(RightEdge, 22.5)).toBe(Slants.Falling);
});

test("90 度回したノードの右辺は縦に伸び縮みする", () => {
  expect(Grip.slantOf(RightEdge, 90)).toBe(Slants.Vertical);
});

test("反時計回りに 45 度回したノードの右辺は右上 - 左下の斜めに伸び縮みする", () => {
  expect(Grip.slantOf(RightEdge, -45)).toBe(Slants.Rising);
});

test("1 回り余分に回したノードは、余りの角度ぶんの向きに伸び縮みする", () => {
  expect(Grip.slantOf(RightEdge, 405)).toBe(Slants.Falling);
});

test("回っていないノードの右下の角は左上 - 右下の斜めに伸び縮みする", () => {
  expect(Grip.slantOf(BottomRight, 0)).toBe(Slants.Falling);
});

test("90 度回したノードの右下の角は右上 - 左下の斜めに伸び縮みする", () => {
  expect(Grip.slantOf(BottomRight, 90)).toBe(Slants.Rising);
});

import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import {
  setupBoxStyle,
  setupEllipseStyle,
  setupTextStyle,
} from "./element-style-setup";

test("座標が数値でない絶対配置の Box は、フローの Box と同じく子の基準になる position を出す", () => {
  const style = setupBoxStyle({ placement: "absolute", x: "40", y: 24 });

  expect(style.position).toBe("relative");
  expect(style).not.toHaveProperty("left");
});

test("座標で置いた Box は、横に並べる親の中でも伸びない", () => {
  const style = setupBoxStyle(
    { placement: "absolute", x: 40, y: 24, widthMode: "fill" },
    { parentDirection: Option.some("row") },
  );

  expect(style).not.toHaveProperty("flex-grow");
});

test("座標が数値でない絶対配置の Box は、flex アイテムとして親いっぱいに伸びる", () => {
  const style = setupBoxStyle(
    { placement: "absolute", x: "40", y: 24, widthMode: "fill" },
    { parentDirection: Option.some("row") },
  );

  expect(style["flex-grow"]).toBe("1");
});

test("座標が数値でない絶対配置の Text は position を出さない", () => {
  const broken = setupTextStyle({ placement: "absolute", x: "40", y: 24 });
  const absolute = setupTextStyle({ placement: "absolute", x: 40, y: 24 });

  // 対照: 座標が読める絶対配置の Text は position を出す
  expect(absolute.position).toBe("absolute");
  expect(broken).not.toHaveProperty("position");
});

test("フローの Ellipse は子の基準になる position を出さない", () => {
  expect(setupEllipseStyle({})).not.toHaveProperty("position");
});

test("絶対配置の Ellipse は指定した座標に置かれる", () => {
  const style = setupEllipseStyle({ placement: "absolute", x: 40, y: 24 });

  expect([style.position, style.left, style.top]).toEqual([
    "absolute",
    "40px",
    "24px",
  ]);
});

test("座標で置いた Ellipse は、横に並べる親の中でも伸びない", () => {
  const style = setupEllipseStyle(
    { placement: "absolute", x: 40, y: 24, widthMode: "fill" },
    Option.some("row"),
  );

  expect(style).not.toHaveProperty("flex-grow");
});

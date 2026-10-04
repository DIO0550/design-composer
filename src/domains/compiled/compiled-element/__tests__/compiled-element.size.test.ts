import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { setupBoxStyle, setupEllipseStyle } from "./element-style-setup";

test("幅を固定した Box は幅を px で出力する", () => {
  expect(setupBoxStyle({ widthMode: "fixed", width: 320 }).width).toBe("320px");
});

test("長さが数値でない固定の高さは Box の高さを出力しない", () => {
  expect(
    "height" in setupBoxStyle({ heightMode: "fixed", height: "abc" }),
  ).toBe(false);
});

test("大きさを書いていない Ellipse は幅・高さとも 100px で描かれる", () => {
  const style = setupEllipseStyle({});

  expect([style.width, style.height]).toEqual(["100px", "100px"]);
});

test("子を横に並べる親の中で高さを fill にした Ellipse は縦いっぱいに広がる", () => {
  expect(
    setupEllipseStyle({ heightMode: "fill" }, Option.some("row"))["align-self"],
  ).toBe("stretch");
});

test("子を横に並べる親の中で幅を fill にした Ellipse は横へ伸びる", () => {
  expect(
    setupEllipseStyle({ widthMode: "fill" }, Option.some("row"))["flex-grow"],
  ).toBe("1");
});

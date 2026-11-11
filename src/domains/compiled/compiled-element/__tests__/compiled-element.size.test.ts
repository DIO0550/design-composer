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

test("子を横に並べる親の中で幅を fill にした Ellipse に最小・最大の幅を書くと min-width / max-width が出る", () => {
  const style = setupEllipseStyle(
    { widthMode: "fill", minWidth: 40, maxWidth: 200 },
    Option.some("row"),
  );

  expect([style["min-width"], style["max-width"]]).toEqual(["40px", "200px"]);
});

test("モードを書いていない Ellipse は既定が fixed なので、書いた最小の幅は出ない", () => {
  expect("min-width" in setupEllipseStyle({ minWidth: 40 })).toBe(false);
});

test("高さを fill にした Ellipse に最小の高さを書くと min-height が出る", () => {
  expect(
    setupEllipseStyle(
      { heightMode: "fill", minHeight: 40 },
      Option.some("row"),
    )["min-height"],
  ).toBe("40px");
});

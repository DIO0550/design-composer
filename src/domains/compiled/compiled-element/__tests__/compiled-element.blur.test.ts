import { expect, test } from "vitest";
import { setupBoxStyle, setupEllipseStyle } from "./element-style-setup";

test("layerBlur を書いた Box は filter の blur を出力する", () => {
  expect(setupBoxStyle({ layerBlur: 4 }).filter).toBe("blur(4px)");
});

test("backdropBlur を書いた Box は backdrop-filter の blur を出力する", () => {
  expect(setupBoxStyle({ backdropBlur: 4 })["backdrop-filter"]).toBe(
    "blur(4px)",
  );
});

test("layerBlur と backdropBlur を両方書いた Box は、それぞれの宣言を出力する", () => {
  const style = setupBoxStyle({ layerBlur: 2, backdropBlur: 8 });

  expect([style.filter, style["backdrop-filter"]]).toEqual([
    "blur(2px)",
    "blur(8px)",
  ]);
});

test("ぼかしが既定のままの Box はぼかしの宣言を出力しない", () => {
  const style = setupBoxStyle({});

  expect(["filter", "backdrop-filter"].filter((p) => p in style)).toEqual([]);
});

test("ぼかしに 0 を書いた Box はぼかしの宣言を出力しない", () => {
  const style = setupBoxStyle({ layerBlur: 0, backdropBlur: 0 });

  expect(["filter", "backdrop-filter"].filter((p) => p in style)).toEqual([]);
});

test("取りうる範囲を外れた負の layerBlur は丸めずそのまま出力する", () => {
  expect(setupBoxStyle({ layerBlur: -4 }).filter).toBe("blur(-4px)");
});

test("数値でない layerBlur は宣言を出力しない", () => {
  expect("filter" in setupBoxStyle({ layerBlur: "4" })).toBe(false);
});

test("layerBlur を書いた Ellipse は filter の blur を出力する", () => {
  expect(setupEllipseStyle({ layerBlur: 3 }).filter).toBe("blur(3px)");
});

test("backdropBlur を書いた Ellipse は backdrop-filter の blur を出力する", () => {
  expect(setupEllipseStyle({ backdropBlur: 3 })["backdrop-filter"]).toBe(
    "blur(3px)",
  );
});

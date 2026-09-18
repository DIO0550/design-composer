import { expect, test } from "vitest";
import { setupBoxStyle, setupTextStyle } from "./element-style-setup";

test("絶対配置の Box に回転を書くと、その角度で回る", () => {
  expect(
    setupBoxStyle({ placement: "absolute", x: 10, y: 20, rotation: 30 })
      .transform,
  ).toBe("rotate(30deg)");
});

test("フローの Box に回転を書いても、その角度で回る", () => {
  expect(setupBoxStyle({ placement: "flow", rotation: 30 }).transform).toBe(
    "rotate(30deg)",
  );
});

test("Text に回転を書くと、その角度で回る", () => {
  expect(setupTextStyle({ rotation: 45 }).transform).toBe("rotate(45deg)");
});

test("回転が書かれていない Box は回転の宣言を出力しない", () => {
  expect("transform" in setupBoxStyle({})).toBe(false);
});

test("回転に既定と同じ 0 を書いた Box も回転の宣言を出力しない", () => {
  expect("transform" in setupBoxStyle({ rotation: 0 })).toBe(false);
});

test("逆回りの角度もそのまま出力する", () => {
  expect(setupBoxStyle({ rotation: -90 }).transform).toBe("rotate(-90deg)");
});

test("1 周を超える角度も丸めずそのまま出力する", () => {
  expect(setupBoxStyle({ rotation: 370 }).transform).toBe("rotate(370deg)");
});

test("数値でない回転は宣言を出力しない", () => {
  expect("transform" in setupBoxStyle({ rotation: "30" })).toBe(false);
});

import { expect, test } from "vitest";
import { setupBoxStyle } from "./element-style-setup";

test("幅を固定した Box は幅を px で出力する", () => {
  expect(setupBoxStyle({ widthMode: "fixed", width: 320 }).width).toBe("320px");
});

test("長さが数値でない固定の高さは Box の高さを出力しない", () => {
  expect(
    "height" in setupBoxStyle({ heightMode: "fixed", height: "abc" }),
  ).toBe(false);
});

import { expect, test } from "vitest";
import { Css } from "../Css";

test("数値を px 単位付きの長さに変換できる", () => {
  expect(Css.px(16)).toBe("16px");
});

test("0 も px 単位付きで表される", () => {
  expect(Css.px(0)).toBe("0px");
});

test("小数はそのまま px 単位付きになる", () => {
  expect(Css.px(0.5)).toBe("0.5px");
});

test("負の値は符号付きの px になる", () => {
  expect(Css.px(-4)).toBe("-4px");
});

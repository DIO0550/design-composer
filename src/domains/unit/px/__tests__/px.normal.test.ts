import { expect, test } from "vitest";
import { Px } from "../index";

test("数値から px 単位付きの長さを作れる", () => {
  expect(Px.create(16)).toBe("16px");
});

test("0 からも px 単位付きの長さになる", () => {
  expect(Px.create(0)).toBe("0px");
});

test("小数はそのまま px 単位付きになる", () => {
  expect(Px.create(0.5)).toBe("0.5px");
});

test("負の値は符号付きの px になる", () => {
  expect(Px.create(-4)).toBe("-4px");
});

test("同じ数値からは常に同じ長さが作られる", () => {
  expect(Px.create(24)).toBe(Px.create(24));
});

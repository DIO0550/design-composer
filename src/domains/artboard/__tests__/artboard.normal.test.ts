import { expect, test } from "vitest";
import { Artboard } from "../index";

test("Artboard を作成すると指定した幅と高さを持つ", () => {
  const artboard = Artboard.create({
    name: "login-screen",
    width: 375,
    height: 812,
  });
  expect(artboard.width).toBe(375);
  expect(artboard.height).toBe(812);
});

test("children を省略して Artboard を作成すると空配列になる", () => {
  const artboard = Artboard.create({
    name: "login-screen",
    width: 375,
    height: 812,
  });
  expect(artboard.children).toEqual([]);
});

test("children を指定して Artboard を作成するとその要素を持つ", () => {
  const child = { name: "login-form", type: "Box" };
  const artboard = Artboard.create({
    name: "login-screen",
    width: 375,
    height: 812,
    children: [child],
  });
  expect(artboard.children).toEqual([child]);
});

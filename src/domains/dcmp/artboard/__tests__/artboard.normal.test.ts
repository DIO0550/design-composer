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

/*
 * 追加直後の大きさは UI 案（docs/Design Composer.html）の artboard が 2 枚とも
 * 720×900 であることだけを根拠にしている（docs/*.md に既定サイズの記述は無い）。
 * 値そのものが一覧の行とキャンバスの枠に出るので、ここで固定する。
 */
test("追加直後の Artboard は UI 案と同じ 720×900 で作られる", () => {
  const artboard = Artboard.createInitial("artboard");

  expect({ width: artboard.width, height: artboard.height }).toEqual({
    width: 720,
    height: 900,
  });
});

test("追加直後の Artboard は渡した名前を持つ", () => {
  expect(Artboard.createInitial("artboard-2").name).toBe("artboard-2");
});

test("追加直後の Artboard は子を持たない", () => {
  expect(Artboard.createInitial("artboard").children).toEqual([]);
});

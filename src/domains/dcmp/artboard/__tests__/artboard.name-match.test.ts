import { expect, test } from "vitest";
import { Artboard } from "../index";

/*
 * 条件は述語で渡る（絞り込みの語彙は session 側にあり、ここからは import できない）。
 * 述語そのものは仕様ではないので、各テストに直接書く。
 */

const Login: Artboard = {
  name: "login",
  width: 720,
  height: 900,
  children: [
    {
      name: "login-form",
      type: "Box",
      children: [{ name: "title", type: "Text" }],
    },
  ],
};

test("artboard 自身の名前が条件に合えば合うと答える", () => {
  expect(Artboard.hasMatchingName(Login, (name) => name === "login")).toBe(
    true,
  );
});

test("配下のノードの名前が条件に合えば合うと答える", () => {
  expect(Artboard.hasMatchingName(Login, (name) => name === "title")).toBe(
    true,
  );
});

test("自分にも配下にも合うものが無ければ合わないと答える", () => {
  expect(Artboard.hasMatchingName(Login, (name) => name === "header")).toBe(
    false,
  );
});

test("集めた名前には自分と配下の両方が並ぶ", () => {
  expect(Artboard.collectNames(Login)).toEqual([
    "login",
    "login-form",
    "title",
  ]);
});

import { expect, test } from "vitest";
import { Artboard } from "../index";

/** 「その名前か」を条件にする。絞り込みの語彙は session 側にあるので、ここへは述語で渡る。 */
function named(target: string): (name: string) => boolean {
  return (name) => name === target;
}

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
  expect(Artboard.hasMatchingName(Login, named("login"))).toBe(true);
});

test("配下のノードの名前が条件に合えば合うと答える", () => {
  expect(Artboard.hasMatchingName(Login, named("title"))).toBe(true);
});

test("自分にも配下にも合うものが無ければ合わないと答える", () => {
  expect(Artboard.hasMatchingName(Login, named("header"))).toBe(false);
});

test("集めた名前には自分と配下の両方が並ぶ", () => {
  expect(Artboard.collectNames(Login)).toEqual([
    "login",
    "login-form",
    "title",
  ]);
});

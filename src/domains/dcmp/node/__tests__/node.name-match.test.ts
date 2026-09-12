import { expect, test } from "vitest";
import { Node } from "../index";

/** 「その名前か」を条件にする。絞り込みの語彙は session 側にあるので、ここへは述語で渡る。 */
function named(target: string): (name: string) => boolean {
  return (name) => name === target;
}

test("自分の名前が条件に合えば、配下に合うものが無くても合うと答える", () => {
  const node = {
    name: "login-form",
    type: "Box",
    children: [{ name: "title", type: "Text" }],
  };

  expect(Node.hasMatchingName(node, named("login-form"))).toBe(true);
});

test("配下のノードの名前が条件に合えば合うと答える", () => {
  const node = {
    name: "login-form",
    type: "Box",
    children: [
      {
        name: "field",
        type: "Box",
        children: [{ name: "label", type: "Text" }],
      },
    ],
  };

  expect(Node.hasMatchingName(node, named("label"))).toBe(true);
});

test("自分にも配下にも合うものが無ければ合わないと答える", () => {
  const node = {
    name: "login-form",
    type: "Box",
    children: [{ name: "title", type: "Text" }],
  };

  expect(Node.hasMatchingName(node, named("header"))).toBe(false);
});

test("子を持たない参照ノードでも自分の名前で答える", () => {
  const node = { name: "submit-button", ref: "primary-button" };

  expect(Node.hasMatchingName(node, named("submit-button"))).toBe(true);
});

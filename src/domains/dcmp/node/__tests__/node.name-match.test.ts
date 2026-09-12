import { expect, test } from "vitest";
import { Node } from "../index";

/*
 * 条件は述語で渡る（絞り込みの語彙は session 側にあり、ここからは import できない）。
 * 述語そのものは仕様ではないので、各テストに直接書く。
 */

test("自分の名前が条件に合えば、配下に合うものが無くても合うと答える", () => {
  const node = {
    name: "login-form",
    type: "Box",
    children: [{ name: "title", type: "Text" }],
  };

  expect(Node.hasMatchingName(node, (name) => name === "login-form")).toBe(
    true,
  );
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

  expect(Node.hasMatchingName(node, (name) => name === "label")).toBe(true);
});

test("自分にも配下にも合うものが無ければ合わないと答える", () => {
  const node = {
    name: "login-form",
    type: "Box",
    children: [{ name: "title", type: "Text" }],
  };

  expect(Node.hasMatchingName(node, (name) => name === "header")).toBe(false);
});

test("子を持たない参照ノードでも自分の名前で答える", () => {
  const node = { name: "submit-button", ref: "primary-button" };

  expect(Node.hasMatchingName(node, (name) => name === "submit-button")).toBe(
    true,
  );
});

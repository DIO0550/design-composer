import { expect, test } from "vitest";
import { Node } from "../index";

test("ref ノードは参照先の部品名を1件返す", () => {
  const node = Node.collectRefs({ name: "instance", ref: "button" });

  expect(node).toEqual(["button"]);
});

test("ref を含まないサブツリーからは参照先が得られない", () => {
  const refs = Node.collectRefs({
    name: "root",
    type: "Box",
    children: [{ name: "label", type: "Text" }],
  });

  expect(refs).toEqual([]);
});

test("子孫にある ref の参照先がすべて集まる", () => {
  const refs = Node.collectRefs({
    name: "root",
    type: "Box",
    children: [
      { name: "instance-1", ref: "button" },
      {
        name: "wrapper",
        type: "Box",
        children: [{ name: "instance-2", ref: "card" }],
      },
    ],
  });

  expect(refs).toEqual(["button", "card"]);
});

test("自分自身の名前でノードを探すとそのノードが見つかる", () => {
  const found = Node.find({ name: "root", type: "Box" }, "root");

  expect(found).toEqual({ some: true, value: { name: "root", type: "Box" } });
});

test("子孫の名前でノードを探すとその子孫が見つかる", () => {
  const found = Node.find(
    {
      name: "root",
      type: "Box",
      children: [
        {
          name: "wrapper",
          type: "Box",
          children: [{ name: "label", type: "Text" }],
        },
      ],
    },
    "label",
  );

  expect(found).toEqual({ some: true, value: { name: "label", type: "Text" } });
});

test("存在しない名前でノードを探すと見つからない", () => {
  const found = Node.find(
    { name: "root", type: "Box", children: [{ name: "label", type: "Text" }] },
    "no-such-node",
  );

  expect(found.some).toBe(false);
});

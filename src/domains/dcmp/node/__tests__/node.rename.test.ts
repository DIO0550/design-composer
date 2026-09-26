import { expect, test } from "vitest";
import { Node } from "../index";

test("ノードの名前を収集すると自身の name が含まれる", () => {
  const node = { name: "box-1", type: "Box" };
  expect(Node.collectNames(node)).toEqual(["box-1"]);
});

test("子を持つノードの名前を収集すると自身と子孫すべての name が含まれる", () => {
  const node = {
    name: "box-1",
    type: "Box",
    children: [
      { name: "label", type: "Text" },
      {
        name: "box-2",
        type: "Box",
        children: [{ name: "label-2", type: "Text" }],
      },
    ],
  };
  expect(Node.collectNames(node)).toEqual([
    "box-1",
    "label",
    "box-2",
    "label-2",
  ]);
});

test("ref ノードの名前を収集すると自身の name のみが含まれる", () => {
  const node = { name: "save-button", ref: "primary-button" };
  expect(Node.collectNames(node)).toEqual(["save-button"]);
});

test("リネームマップに含まれる名前のノードは新しい名前に置き換わる", () => {
  const node = { name: "box-1", type: "Box" };
  const result = Node.rename(node, { "box-1": "box-1-2" });
  expect(result).toEqual({ name: "box-1-2", type: "Box" });
});

test("リネームマップに含まれない名前のノードは変更されない", () => {
  const node = { name: "box-1", type: "Box" };
  const result = Node.rename(node, { "other-node": "other-node-2" });
  expect(result).toBe(node);
});

test("子孫ノードもリネームマップに従って再帰的に置き換わる", () => {
  const node = {
    name: "box-1",
    type: "Box",
    children: [{ name: "label", type: "Text" }],
  };
  const result = Node.rename(node, {
    "box-1": "box-1-2",
    label: "label-2",
  });
  expect(result).toEqual({
    name: "box-1-2",
    type: "Box",
    children: [{ name: "label-2", type: "Text" }],
  });
});

test("ref ノードはリネームマップに従って name のみが置き換わる", () => {
  const node = { name: "save-button", ref: "primary-button" };
  const result = Node.rename(node, { "save-button": "save-button-2" });
  expect(result).toEqual({ name: "save-button-2", ref: "primary-button" });
});

test("rename は元のノードを変更しない", () => {
  const child = { name: "label", type: "Text" };
  const node = { name: "box-1", type: "Box", children: [child] };
  Node.rename(node, { "box-1": "box-1-2", label: "label-2" });
  expect(node).toEqual({
    name: "box-1",
    type: "Box",
    children: [{ name: "label", type: "Text" }],
  });
});

test("対応表に無い constructor という名前は、付け替えずにそのまま残る", () => {
  const node = { name: "constructor", type: "Box" };

  expect(Node.rename(node, {}).name).toBe("constructor");
});

test("対応表に無い __proto__ という名前は、付け替えずにそのまま残る", () => {
  const node = { name: "__proto__", type: "Box" };

  expect(Node.rename(node, {}).name).toBe("__proto__");
});

/** 使われている名前なら `-b` を付ける。`renameEach` に渡す、決め方の見本。 */
function suffixIfTaken(name: string, taken: ReadonlySet<string>): string {
  return taken.has(name) ? `${name}-b` : name;
}

test("1 ノードずつ付け替えると、親に決めた名前が子の名前を決めるときに使われている", () => {
  const node = {
    name: "item",
    type: "Box",
    children: [{ name: "item", type: "Text" }],
  };

  expect(Node.renameEach([node], new Set(), suffixIfTaken)).toEqual([
    { name: "item", type: "Box", children: [{ name: "item-b", type: "Text" }] },
  ]);
});

test("1 ノードずつ付け替えると、前の兄弟に決めた名前が次の兄弟の名前を決めるときに使われている", () => {
  const node = {
    name: "list",
    type: "Box",
    children: [
      { name: "item", type: "Text" },
      { name: "item", type: "Text" },
    ],
  };

  expect(Node.renameEach([node], new Set(), suffixIfTaken)).toEqual([
    {
      name: "list",
      type: "Box",
      children: [
        { name: "item", type: "Text" },
        { name: "item-b", type: "Text" },
      ],
    },
  ]);
});

test("1 ノードずつ付け替えると、前の根の子孫に決めた名前が次の根の名前を決めるときに使われている", () => {
  const first = {
    name: "list",
    type: "Box",
    children: [{ name: "item", type: "Text" }],
  };
  const second = { name: "item", type: "Text" };

  expect(Node.renameEach([first, second], new Set(), suffixIfTaken)).toEqual([
    first,
    { name: "item-b", type: "Text" },
  ]);
});

test("1 ノードずつ付け替えると、次のノードの名前を決めるときに使われているのは元の名前ではなく決めた名前", () => {
  const nodes = [
    { name: "item", type: "Text" },
    { name: "item-b", type: "Text" },
  ];

  expect(Node.renameEach(nodes, new Set(["item"]), suffixIfTaken)).toEqual([
    { name: "item-b", type: "Text" },
    { name: "item-b-b", type: "Text" },
  ]);
});

test("1 ノードずつ付け替えると、ref ノードは name だけが置き換わる", () => {
  const node = { name: "save-button", ref: "primary-button" };

  expect(
    Node.renameEach([node], new Set(["save-button"]), suffixIfTaken),
  ).toEqual([{ name: "save-button-b", ref: "primary-button" }]);
});

test("1 ノードずつ付け替えても、渡したノードは変わらない", () => {
  const node = {
    name: "item",
    type: "Box",
    children: [{ name: "item", type: "Text" }],
  };

  Node.renameEach([node], new Set(["item"]), suffixIfTaken);

  expect(node).toEqual({
    name: "item",
    type: "Box",
    children: [{ name: "item", type: "Text" }],
  });
});

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

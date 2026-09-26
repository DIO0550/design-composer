import { expect, test } from "vitest";
import { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { NodeTree } from "../index";

/*
 * 名前が重複した不正な並び。深い方を前の兄弟の子に置くのは、浅い方が前にあると探し方に
 * よらず浅い方に当たり、`find` と同じ相手を選んでいるかを確かめられないため。
 */
function setupDeepFirstTree(): NodeTree {
  return NodeTree.create([
    {
      name: "row",
      type: "Box",
      children: [{ name: "label", type: "Text", props: { content: "深" } }],
    },
    { name: "label", type: "Text", props: { content: "浅" } },
  ]);
}

function setupSameLevelTree(): NodeTree {
  return NodeTree.create([
    { name: "label", type: "Text", props: { content: "先" } },
    { name: "label", type: "Text", props: { content: "後" } },
  ]);
}

const Replacement: Node = {
  name: "label",
  type: "Text",
  props: { content: "新" },
};

test("同じ名前が前の兄弟の子と直下にあるとき、位置は find が返すノードを指す", () => {
  const tree = setupDeepFirstTree();

  const position = Option.unwrap(
    NodeTree.childPositionOf(tree, "home", "label"),
  );
  const parent = Option.unwrap(NodeTree.find(tree, position.parentName));

  expect(Node.children(parent)[position.index]).toBe(
    Option.unwrap(NodeTree.find(tree, "label")),
  );
});

test("同じ名前が前の兄弟の子と直下にあるとき、差し替えは find が返す子の側に入り直下は残る", () => {
  const replaced = Option.unwrap(
    NodeTree.replaceByName(setupDeepFirstTree(), "label", Replacement),
  );

  expect(NodeTree.nodes(replaced)).toEqual([
    { name: "row", type: "Box", children: [Replacement] },
    { name: "label", type: "Text", props: { content: "浅" } },
  ]);
});

test("同じ名前が同じ並びに 2 つあるとき、差し替えは先の 1 つだけを置き換える", () => {
  const replaced = Option.unwrap(
    NodeTree.replaceByName(setupSameLevelTree(), "label", Replacement),
  );

  expect(NodeTree.nodes(replaced)).toEqual([
    Replacement,
    { name: "label", type: "Text", props: { content: "後" } },
  ]);
});

test("同じ名前が同じ並びに 2 つあるとき、取り除きは先の 1 つだけを取り除く", () => {
  const removed = Option.unwrap(
    NodeTree.removeByName(setupSameLevelTree(), "label"),
  );

  expect(NodeTree.nodes(removed)).toEqual([
    { name: "label", type: "Text", props: { content: "後" } },
  ]);
});

test("同じ名前の親が前の兄弟の子と直下にあるとき、子の並びの差し替えは find が返す親に入る", () => {
  const tree = NodeTree.create([
    {
      name: "row",
      type: "Box",
      children: [{ name: "panel", type: "Box", props: { gap: 1 } }],
    },
    { name: "panel", type: "Box", props: { gap: 2 } },
  ]);

  const updated = Option.unwrap(
    Result.unwrap(
      NodeTree.updateChildrenOf(tree, "panel", (children) =>
        NodeTree.insertAt(children, 0, { name: "badge", type: "Text" }),
      ),
    ),
  );

  const panel = Option.unwrap(NodeTree.find(updated, "panel"));
  expect({
    gap: Node.isPrimitive(panel) && panel.props?.gap,
    children: Node.children(panel).map((child) => child.name),
  }).toEqual({ gap: 1, children: ["badge"] });
});

test("同じ名前の親が前の兄弟の子にある子を持てないノードと直下の Box のとき、子の並びの差し替えは children-not-allowed になり Box には入らない", () => {
  const tree = NodeTree.create([
    {
      name: "row",
      type: "Box",
      children: [{ name: "panel", type: "Text" }],
    },
    { name: "panel", type: "Box" },
  ]);

  const updated = NodeTree.updateChildrenOf(tree, "panel", (children) =>
    NodeTree.insertAt(children, 0, { name: "badge", type: "Text" }),
  );

  expect(updated).toEqual(
    Result.err({ kind: "children-not-allowed", name: "panel" }),
  );
});

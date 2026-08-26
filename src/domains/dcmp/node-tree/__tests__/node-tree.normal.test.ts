import { expect, test } from "vitest";
import type { Node } from "@/domains/dcmp/node";
import { Result } from "@/utils/Result";
import { NodeTree } from "../index";

function setupTree(): NodeTree {
  const nodes: readonly Node[] = [
    {
      name: "row",
      type: "Box",
      children: [
        { name: "title", type: "Text" },
        { name: "caption", type: "Text" },
      ],
    },
    { name: "footer", type: "Text" },
  ];
  return NodeTree.create(nodes);
}

test("並びの直下にあるノードを名前で引ける", () => {
  const found = NodeTree.find(setupTree(), "footer");

  expect(found.some && found.value.name).toBe("footer");
});

test("子孫にあるノードも名前で引ける", () => {
  const found = NodeTree.find(setupTree(), "caption");

  expect(found.some && found.value.name).toBe("caption");
});

test("指定した位置にノードを挿入すると並びのその位置に入る", () => {
  const inserted = NodeTree.insertAt(setupTree(), 1, {
    name: "divider",
    type: "Box",
  });

  expect(
    NodeTree.nodes(Result.unwrap(inserted)).map((node) => node.name),
  ).toEqual(["row", "divider", "footer"]);
});

test("名前で指したノードを取り除くと並びから消える", () => {
  const removed = NodeTree.removeByName(setupTree(), "footer");

  expect(
    removed.some && NodeTree.nodes(removed.value).map((node) => node.name),
  ).toEqual(["row"]);
});

test("子孫のノードを取り除くとその親の子から消える", () => {
  const removed = NodeTree.removeByName(setupTree(), "title");
  const row = removed.some ? NodeTree.nodes(removed.value)[0] : undefined;

  expect(
    row && "children" in row ? row.children?.map((node) => node.name) : [],
  ).toEqual(["caption"]);
});

test("名前で指したノードを差し替えると同じ位置に新しいノードが入る", () => {
  const replaced = NodeTree.replaceByName(setupTree(), "footer", {
    name: "footer",
    ref: "site-footer",
  });
  const footer = replaced.some ? NodeTree.nodes(replaced.value)[1] : undefined;

  expect(footer && "ref" in footer ? footer.ref : undefined).toBe(
    "site-footer",
  );
});

test("並びの中で位置を入れ替えると順序が変わる", () => {
  const moved = NodeTree.moveWithin(setupTree(), 0, 1);

  expect(NodeTree.nodes(Result.unwrap(moved)).map((node) => node.name)).toEqual(
    ["footer", "row"],
  );
});

test("親を指定して子の並びを差し替えるとその親の children が変わる", () => {
  const updated = NodeTree.updateChildrenOf(setupTree(), "row", (children) =>
    NodeTree.insertAt(children, 0, { name: "eyebrow", type: "Text" }),
  );
  const tree = Result.unwrap(updated);
  const row = tree.some ? NodeTree.nodes(tree.value)[0] : undefined;

  expect(
    row && "children" in row ? row.children?.map((node) => node.name) : [],
  ).toEqual(["eyebrow", "title", "caption"]);
});

test("編集しても元の並びは変わらない", () => {
  const tree = setupTree();

  NodeTree.removeByName(tree, "footer");

  expect(NodeTree.nodes(tree).map((node) => node.name)).toEqual([
    "row",
    "footer",
  ]);
});

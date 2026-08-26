import { expect, test } from "vitest";
import type { Node } from "@/domains/dcmp/node";
import { Result } from "@/utils/Result";
import { NodeTree } from "../index";

function setupTree(): NodeTree {
  const nodes: readonly Node[] = [
    { name: "row", type: "Box", children: [{ name: "title", type: "Text" }] },
    { name: "label", type: "Text" },
    { name: "instance", ref: "button" },
  ];
  return NodeTree.create(nodes);
}

test("並びに存在しない名前を引くと見つからない", () => {
  expect(NodeTree.find(setupTree(), "missing").some).toBe(false);
});

test("存在しない名前のノードは取り除けない", () => {
  expect(NodeTree.removeByName(setupTree(), "missing").some).toBe(false);
});

test("存在しない名前のノードは差し替えられない", () => {
  const replaced = NodeTree.replaceByName(setupTree(), "missing", {
    name: "missing",
    type: "Text",
  });

  expect(replaced.some).toBe(false);
});

test("子を持てないノードを親に指定すると children-not-allowed になる", () => {
  const updated = NodeTree.updateChildrenOf(setupTree(), "label", (children) =>
    Result.ok(children),
  );

  expect(updated).toEqual(
    Result.err({ kind: "children-not-allowed", name: "label" }),
  );
});

test("参照ノードを親に指定すると children-not-allowed になる", () => {
  const updated = NodeTree.updateChildrenOf(
    setupTree(),
    "instance",
    (children) => Result.ok(children),
  );

  expect(updated).toEqual(
    Result.err({ kind: "children-not-allowed", name: "instance" }),
  );
});

test("並びに存在しない親を指定すると親が見つからない結果になる", () => {
  const updated = NodeTree.updateChildrenOf(
    setupTree(),
    "missing",
    (children) => Result.ok(children),
  );

  expect(Result.unwrap(updated).some).toBe(false);
});

test("範囲外の位置へ挿入すると index-out-of-range になる", () => {
  const inserted = NodeTree.insertAt(setupTree(), 9, {
    name: "extra",
    type: "Text",
  });

  expect(inserted).toEqual(
    Result.err({ kind: "index-out-of-range", index: 9, length: 3 }),
  );
});

test("範囲外の位置から動かすと index-out-of-range になる", () => {
  const moved = NodeTree.moveWithin(setupTree(), 9, 0);

  expect(moved).toEqual(
    Result.err({ kind: "index-out-of-range", index: 9, length: 3 }),
  );
});

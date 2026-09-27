import { expect, test } from "vitest";
import { Node } from "../index";

test("子孫にある参照ノードが行きがけ順ですべて集まる", () => {
  const refNodes = Node.collectRefNodes({
    name: "root",
    type: "Box",
    children: [
      {
        name: "wrapper",
        type: "Box",
        children: [{ name: "instance-1", ref: "button" }],
      },
      { name: "instance-2", ref: "card", overrides: { label: "x" } },
    ],
  });

  expect(refNodes).toEqual([
    { name: "instance-1", ref: "button" },
    { name: "instance-2", ref: "card", overrides: { label: "x" } },
  ]);
});

test("起点が参照ノードならそのノード自身が返る", () => {
  const refNodes = Node.collectRefNodes({ name: "instance", ref: "button" });

  expect(refNodes).toEqual([{ name: "instance", ref: "button" }]);
});

test("参照ノードの無いサブツリーからは何も集まらない", () => {
  const refNodes = Node.collectRefNodes({
    name: "root",
    type: "Box",
    children: [{ name: "label", type: "Text" }],
  });

  expect(refNodes).toEqual([]);
});

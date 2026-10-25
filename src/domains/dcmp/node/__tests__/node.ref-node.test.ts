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

test("インスタンス自身の値は直下に書かれたロックだけで、公開 prop の上書きを含まない", () => {
  expect(
    Node.refOwnPropsOf({
      name: "submit",
      ref: "primary-button",
      locking: "locked",
      overrides: { label: "保存", locking: "unlocked" },
    }),
  ).toEqual({ locking: "locked" });
});

test("直下に何も書かれていないインスタンス自身の値は空", () => {
  expect(
    Node.refOwnPropsOf({
      name: "submit",
      ref: "primary-button",
      overrides: { locking: "locked" },
    }),
  ).toEqual({});
});

test("部品化の分割では、ロックが根から参照ノード側へ移る", () => {
  const split = Node.splitRefOwnProps({
    name: "card",
    type: "Box",
    props: { locking: "locked" },
  });

  expect(split).toEqual({
    root: { name: "card", type: "Box" },
    refOwnProps: { locking: "locked" },
  });
});

test("部品化の分割では、unlocked と書かれたロックも参照ノード側へ移る", () => {
  const split = Node.splitRefOwnProps({
    name: "card",
    type: "Box",
    props: { locking: "unlocked" },
  });

  expect(split).toEqual({
    root: { name: "card", type: "Box" },
    refOwnProps: { locking: "unlocked" },
  });
});

test("根にロックが書かれていなければ、参照ノード側は空で根は元のまま", () => {
  const node = {
    name: "card",
    type: "Box",
    props: { gap: "md" },
    children: [{ name: "card-title", type: "Text" }],
  };

  expect(Node.splitRefOwnProps(node)).toEqual({ root: node, refOwnProps: {} });
});

test("部品化の分割では、ロック以外の props と子は根に残る", () => {
  const split = Node.splitRefOwnProps({
    name: "card",
    type: "Box",
    props: { gap: "md", locking: "locked" },
    children: [{ name: "card-title", type: "Text" }],
  });

  expect(split.root).toEqual({
    name: "card",
    type: "Box",
    props: { gap: "md" },
    children: [{ name: "card-title", type: "Text" }],
  });
});

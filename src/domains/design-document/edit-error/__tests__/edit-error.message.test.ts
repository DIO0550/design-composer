import { expect, test } from "vitest";
import { DesignDocumentEditError } from "../index";

test("node-not-found は見つからなかったノード名を含むメッセージになる", () => {
  expect(
    DesignDocumentEditError.message({
      kind: "node-not-found",
      name: "missing",
    }),
  ).toBe('node "missing" not found');
});

test("children-not-allowed は子を持てないノード名を含むメッセージになる", () => {
  expect(
    DesignDocumentEditError.message({
      kind: "children-not-allowed",
      name: "label",
    }),
  ).toBe('node "label" cannot have children');
});

test("move-into-descendant は移動元と移動先の両方を含むメッセージになる", () => {
  expect(
    DesignDocumentEditError.message({
      kind: "move-into-descendant",
      name: "box-1",
      parentName: "box-2",
    }),
  ).toBe(
    'cannot move node "box-1" into "box-2" because it is the node itself or its descendant',
  );
});

test("parent-not-found は見つからなかった親の名前を含むメッセージになる", () => {
  expect(
    DesignDocumentEditError.message({
      kind: "parent-not-found",
      name: "missing-box",
    }),
  ).toBe('parent "missing-box" not found');
});

test("artboard-not-found は見つからなかった artboard 名を含むメッセージになる", () => {
  expect(
    DesignDocumentEditError.message({
      kind: "artboard-not-found",
      name: "missing-screen",
    }),
  ).toBe('artboard "missing-screen" not found');
});

test("ref-node-not-supported は部品化できなかったノード名を含むメッセージになる", () => {
  expect(
    DesignDocumentEditError.message({
      kind: "ref-node-not-supported",
      name: "instance",
    }),
  ).toBe('cannot create a component from ref node "instance"');
});

test("ref-node-required は解除できなかったノード名を含むメッセージになる", () => {
  expect(
    DesignDocumentEditError.message({
      kind: "ref-node-required",
      name: "box-1",
    }),
  ).toBe('node "box-1" is not a ref node');
});

test("duplicate-name は既に使われている名前を含むメッセージになる", () => {
  expect(
    DesignDocumentEditError.message({
      kind: "duplicate-name",
      name: "button",
    }),
  ).toBe('name "button" is already used');
});

test("invalid-name は規則を満たさなかった名前を含むメッセージになる", () => {
  expect(
    DesignDocumentEditError.message({
      kind: "invalid-name",
      name: "Card",
    }),
  ).toBe('name "Card" is not a valid identifier');
});

test("index-out-of-range は指定された index と配列長を含むメッセージになる", () => {
  expect(
    DesignDocumentEditError.message({
      kind: "index-out-of-range",
      index: 5,
      length: 2,
    }),
  ).toBe("index 5 is out of bounds for length 2");
});

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

test("index-out-of-range は指定された index と配列長を含むメッセージになる", () => {
  expect(
    DesignDocumentEditError.message({
      kind: "index-out-of-range",
      index: 5,
      length: 2,
    }),
  ).toBe("index 5 is out of bounds for length 2");
});

import { expect, test } from "vitest";
import { DocumentNames } from "../index";

test("名前空間と衝突しないノードは名前が変わらない", () => {
  const node = { name: "label", type: "Text" };
  const documentNames = DocumentNames.create(["screen"]);

  expect(DocumentNames.renameSubtree(documentNames, [node])).toEqual([node]);
});

test("名前空間と衝突するノードは連番付きの名前に付け替わる", () => {
  const node = { name: "label", type: "Text" };
  const documentNames = DocumentNames.create(["label"]);

  expect(DocumentNames.renameSubtree(documentNames, [node])).toEqual([
    { name: "label-2", type: "Text" },
  ]);
});

test("部分木の子孫もまとめて付け替わる", () => {
  const node = {
    name: "box-1",
    type: "Box",
    children: [{ name: "label", type: "Text" }],
  };
  const documentNames = DocumentNames.create(["box-1", "label"]);

  expect(DocumentNames.renameSubtree(documentNames, [node])).toEqual([
    {
      name: "box-1-2",
      type: "Box",
      children: [{ name: "label-2", type: "Text" }],
    },
  ]);
});

test("複数のノードを付け替えると、付け替えた名前どうしも衝突しない", () => {
  const first = { name: "label", type: "Text" };
  const second = { name: "label-2", type: "Text" };
  const documentNames = DocumentNames.create(["label", "label-2"]);

  expect(DocumentNames.renameSubtree(documentNames, [first, second])).toEqual([
    { name: "label-3", type: "Text" },
    { name: "label-2-2", type: "Text" },
  ]);
});

test("付け替えても渡したノードは変わらない", () => {
  const node = { name: "label", type: "Text" };
  const documentNames = DocumentNames.create(["label"]);

  DocumentNames.renameSubtree(documentNames, [node]);

  expect(node).toEqual({ name: "label", type: "Text" });
});

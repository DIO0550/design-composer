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

test("名前空間に無い同じ名前が 2 回現れると、最初はそのまま、2 つ目は連番になる", () => {
  const documentNames = DocumentNames.create([]);

  expect(
    DocumentNames.renameSubtree(documentNames, [
      { name: "title", type: "Text" },
      { name: "title", type: "Text" },
    ]),
  ).toEqual([
    { name: "title", type: "Text" },
    { name: "title-2", type: "Text" },
  ]);
});

test("名前空間と衝突する同じ名前が 2 回現れると、別々の連番になる", () => {
  const documentNames = DocumentNames.create(["title"]);

  expect(
    DocumentNames.renameSubtree(documentNames, [
      { name: "title", type: "Text" },
      { name: "title", type: "Text" },
    ]),
  ).toEqual([
    { name: "title-2", type: "Text" },
    { name: "title-3", type: "Text" },
  ]);
});

test("同じ名前が別々の親の下に現れても、別々の名前になる", () => {
  const documentNames = DocumentNames.create(["badge", "label"]);
  const first = {
    name: "badge",
    type: "Box",
    children: [{ name: "label", type: "Text" }],
  };
  const second = {
    name: "badge",
    type: "Box",
    children: [{ name: "label", type: "Text" }],
  };

  expect(DocumentNames.renameSubtree(documentNames, [first, second])).toEqual([
    {
      name: "badge-2",
      type: "Box",
      children: [{ name: "label-2", type: "Text" }],
    },
    {
      name: "badge-3",
      type: "Box",
      children: [{ name: "label-3", type: "Text" }],
    },
  ]);
});

test("__proto__ という名前も、衝突すれば連番に付け替わる", () => {
  const node = { name: "__proto__", type: "Text" };
  const documentNames = DocumentNames.create(["__proto__"]);

  expect(DocumentNames.renameSubtree(documentNames, [node])).toEqual([
    { name: "__proto__-2", type: "Text" },
  ]);
});

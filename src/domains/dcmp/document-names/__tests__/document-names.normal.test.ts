import { expect, test } from "vitest";
import type { Artboard } from "@/domains/dcmp/artboard";
import type { ComponentSet } from "@/domains/dcmp/component";
import { DocumentNames } from "../index";

function setupArtboards(): readonly Artboard[] {
  return [
    {
      name: "screen",
      width: 375,
      height: 812,
      children: [
        {
          name: "row",
          type: "Box",
          children: [{ name: "title", type: "Text" }],
        },
      ],
    },
  ];
}

function setupComponents(): ComponentSet {
  return {
    button: { type: "Box", children: [{ name: "label", type: "Text" }] },
  };
}

test("artboard 名は名前空間に含まれる", () => {
  const documentNames = DocumentNames.create(
    DocumentNames.collectNames({}, setupArtboards()),
  );

  expect(DocumentNames.has(documentNames, "screen")).toBe(true);
});

test("artboard 配下のノード名は名前空間に含まれる", () => {
  const documentNames = DocumentNames.create(
    DocumentNames.collectNames({}, setupArtboards()),
  );

  expect(DocumentNames.has(documentNames, "title")).toBe(true);
});

test("部品名は名前空間に含まれる", () => {
  const documentNames = DocumentNames.create(
    DocumentNames.collectNames(setupComponents(), []),
  );

  expect(DocumentNames.has(documentNames, "button")).toBe(true);
});

test("部品内部のノード名も名前空間に含まれる", () => {
  const documentNames = DocumentNames.create(
    DocumentNames.collectNames(setupComponents(), []),
  );

  expect(DocumentNames.has(documentNames, "label")).toBe(true);
});

test("2回以上現れる名前だけが重複として返る", () => {
  const documentNames = DocumentNames.create(["a", "b", "a", "c", "b"]);

  expect(DocumentNames.duplicatedNames(documentNames)).toEqual(["a", "b"]);
});

test("同じ名前が3回現れても重複として1度だけ返る", () => {
  const documentNames = DocumentNames.create(["a", "a", "a"]);

  expect(DocumentNames.duplicatedNames(documentNames)).toEqual(["a"]);
});

test("未使用の名前はそのまま使える", () => {
  const documentNames = DocumentNames.create(["title"]);

  expect(DocumentNames.uniqueName(documentNames, "caption")).toBe("caption");
});

test("使用中の名前には連番が付く", () => {
  const documentNames = DocumentNames.create(["title"]);

  expect(DocumentNames.uniqueName(documentNames, "title")).toBe("title-2");
});

test("連番の名前も使用中ならさらに次の連番になる", () => {
  const documentNames = DocumentNames.create(["title", "title-2"]);

  expect(DocumentNames.uniqueName(documentNames, "title")).toBe("title-3");
});

test("名前の集合には重複が畳まれて入る", () => {
  const documentNames = DocumentNames.create(["a", "a", "b"]);

  expect(DocumentNames.toSet(documentNames)).toEqual(new Set(["a", "b"]));
});

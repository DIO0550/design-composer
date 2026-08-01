import { expect, test } from "vitest";
import type { Artboard } from "@/domains/artboard";
import type { ComponentSet } from "@/domains/component";
import { NameSpace } from "../index";

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
  const space = NameSpace.create(NameSpace.collectNames({}, setupArtboards()));

  expect(NameSpace.has(space, "screen")).toBe(true);
});

test("artboard 配下のノード名は名前空間に含まれる", () => {
  const space = NameSpace.create(NameSpace.collectNames({}, setupArtboards()));

  expect(NameSpace.has(space, "title")).toBe(true);
});

test("部品名は名前空間に含まれる", () => {
  const space = NameSpace.create(NameSpace.collectNames(setupComponents(), []));

  expect(NameSpace.has(space, "button")).toBe(true);
});

test("部品内部のノード名も名前空間に含まれる", () => {
  const space = NameSpace.create(NameSpace.collectNames(setupComponents(), []));

  expect(NameSpace.has(space, "label")).toBe(true);
});

test("2回以上現れる名前だけが重複として返る", () => {
  const space = NameSpace.create(["a", "b", "a", "c", "b"]);

  expect(NameSpace.duplicatedNames(space)).toEqual(["a", "b"]);
});

test("同じ名前が3回現れても重複として1度だけ返る", () => {
  const space = NameSpace.create(["a", "a", "a"]);

  expect(NameSpace.duplicatedNames(space)).toEqual(["a"]);
});

test("未使用の名前はそのまま使える", () => {
  const space = NameSpace.create(["title"]);

  expect(NameSpace.uniqueName(space, "caption")).toBe("caption");
});

test("使用中の名前には連番が付く", () => {
  const space = NameSpace.create(["title"]);

  expect(NameSpace.uniqueName(space, "title")).toBe("title-2");
});

test("連番の名前も使用中ならさらに次の連番になる", () => {
  const space = NameSpace.create(["title", "title-2"]);

  expect(NameSpace.uniqueName(space, "title")).toBe("title-3");
});

test("付け替えた名前どうしも衝突しない", () => {
  const space = NameSpace.create(["title"]);

  expect(NameSpace.renameMap(space, ["title", "title-2"])).toEqual({
    title: "title-2",
    "title-2": "title-2-2",
  });
});

test("名前の集合には重複が畳まれて入る", () => {
  const space = NameSpace.create(["a", "a", "b"]);

  expect(NameSpace.toSet(space)).toEqual(new Set(["a", "b"]));
});

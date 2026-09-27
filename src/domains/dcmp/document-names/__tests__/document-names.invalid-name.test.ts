import { expect, test } from "vitest";
import type { Artboard } from "@/domains/dcmp/artboard";
import type { ComponentSet } from "@/domains/dcmp/component";
import { DocumentNames } from "../index";

/**
 * `screen` という名前の artboard。
 *
 * @param children artboard の子の並び
 * @returns `children` を子に持つ artboard
 */
function setupArtboard(children: Artboard["children"]): Artboard {
  return { name: "screen", width: 375, height: 812, children };
}

test("識別子の規則を満たさない名前が、部品から artboard の順に、親から子への行きがけ順で集まる", () => {
  // artboard 名（Alpha）は辞書順では部品名（Card）より前に来る
  const components: ComponentSet = {
    Card: { type: "Box", children: [{ name: "Title", type: "Text" }] },
  };
  const artboards: readonly Artboard[] = [
    {
      name: "Alpha",
      width: 375,
      height: 812,
      children: [
        {
          name: "Label",
          type: "Box",
          children: [{ name: "Icon", type: "Text" }],
        },
      ],
    },
  ];

  expect(DocumentNames.collectInvalidNames(components, artboards)).toEqual([
    { kind: "invalid-identifier", name: "Card" },
    { kind: "invalid-identifier", name: "Title" },
    { kind: "invalid-identifier", name: "Alpha" },
    { kind: "invalid-identifier", name: "Label" },
    { kind: "invalid-identifier", name: "Icon" },
  ]);
});

test("名前が空のノードは、親の名前と子の位置で集まる", () => {
  const artboards = [
    setupArtboard([
      { name: "label", type: "Text" },
      { name: "", type: "Text" },
    ]),
  ];

  expect(DocumentNames.collectInvalidNames({}, artboards)).toEqual([
    {
      kind: "missing-name",
      place: { kind: "child", ownerName: "screen", index: 1 },
    },
  ]);
});

test("名前が空のノードの子は、名前のある祖先を入れ物として集まる", () => {
  const artboards = [
    setupArtboard([
      {
        name: "row",
        type: "Box",
        children: [
          {
            name: "",
            type: "Box",
            children: [
              { name: "icon", type: "Text" },
              { name: "", type: "Text" },
            ],
          },
        ],
      },
    ]),
  ];

  expect(DocumentNames.collectInvalidNames({}, artboards)).toEqual([
    {
      kind: "missing-name",
      place: { kind: "child", ownerName: "row", index: 0 },
    },
    {
      kind: "missing-name",
      place: { kind: "child", ownerName: "row", index: 1 },
    },
  ]);
});

test("名前が空の artboard は、artboard の並びの位置で集まる", () => {
  const artboards: readonly Artboard[] = [
    setupArtboard([]),
    { name: "", width: 375, height: 812, children: [] },
  ];

  expect(DocumentNames.collectInvalidNames({}, artboards)).toEqual([
    { kind: "missing-name", place: { kind: "artboard", index: 1 } },
  ]);
});

test("名前が空の部品キーは、部品として集まる", () => {
  const components: ComponentSet = { "": { type: "Box" } };

  expect(DocumentNames.collectInvalidNames(components, [])).toEqual([
    { kind: "missing-name", place: { kind: "component" } },
  ]);
});

test("名前が空のものは識別子違反として二重に集まらない", () => {
  const artboards = [setupArtboard([{ name: "", type: "Text" }])];

  expect(
    DocumentNames.collectInvalidNames({}, artboards).map(
      (invalidName) => invalidName.kind,
    ),
  ).toEqual(["missing-name"]);
});

test("識別子の規則を満たす名前だけなら何も集まらない", () => {
  const components: ComponentSet = {
    card: { type: "Box", children: [{ name: "title", type: "Text" }] },
  };
  const artboards = [setupArtboard([{ name: "label", type: "Text" }])];

  expect(DocumentNames.collectInvalidNames(components, artboards)).toEqual([]);
});

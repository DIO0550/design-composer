import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { Node } from "@/domains/dcmp/node";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/*
 * 名前が重複した不正なドキュメント（docs/03-schema.md「不正ファイル時の挙動」では開いて
 * 編集を続けられる）。深い方を前の兄弟の子に置く理由は node-tree.ambiguous-name と同じ。
 */
function setupDocument(children: readonly Node[]): DesignDocument {
  return DesignDocument.create({
    artboards: [{ name: "home", width: 360, height: 640, children }],
  });
}

function setupDeepFirstLabels(): DesignDocument {
  return setupDocument([
    {
      name: "row",
      type: "Box",
      children: [{ name: "label", type: "Text", props: { content: "深" } }],
    },
    { name: "label", type: "Text", props: { content: "浅" } },
  ]);
}

function setupDeepFirstPanels(): DesignDocument {
  return setupDocument([
    {
      name: "row",
      type: "Box",
      children: [
        {
          name: "panel",
          type: "Box",
          props: { gap: 1 },
          children: [
            { name: "first", type: "Text" },
            { name: "second", type: "Text" },
          ],
        },
      ],
    },
    { name: "panel", type: "Box", props: { gap: 2 } },
  ]);
}

function setupSameLevelLabels(): DesignDocument {
  return setupDocument([
    { name: "label", type: "Text", props: { content: "先" } },
    { name: "label", type: "Text", props: { content: "後" } },
  ]);
}

function setupDuplicatedArtboards(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      { name: "home", width: 100, height: 100, children: [] },
      { name: "home", width: 200, height: 200, children: [] },
    ],
  });
}

function childrenOf(document: DesignDocument, name: string): readonly Node[] {
  return Option.unwrap(DesignDocument.findChildren(document, name));
}

function contentsOf(nodes: readonly Node[]): readonly unknown[] {
  return nodes.map((node) => Node.isPrimitive(node) && node.props?.content);
}

test("同じ名前のノードが前の兄弟の子と直下にあるとき、props の編集は findNode が返すノードに書かれ直下は元のまま", () => {
  const edited = Result.unwrap(
    DesignDocument.applyPropEdit(setupDeepFirstLabels(), "label", {
      names: ["content"],
      value: Option.some("新"),
    }),
  );

  expect({
    inRow: contentsOf(childrenOf(edited, "row")),
    direct: contentsOf(childrenOf(edited, "home")).slice(1),
  }).toEqual({ inRow: ["新"], direct: ["浅"] });
});

test("同じ名前のノードが前の兄弟の子と直下にあるとき、findChildPosition の位置にあるのは findNode が返すノード", () => {
  const document = setupDeepFirstLabels();

  const position = Option.unwrap(
    DesignDocument.findChildPosition(document, "label"),
  );

  expect(childrenOf(document, position.parentName)[position.index]).toBe(
    Option.unwrap(DesignDocument.findNode(document, "label")),
  );
});

test("同じ名前のノードが前の兄弟の子と直下にあるとき、移動は findNode が返すノードを移し直下は元の位置に残る", () => {
  const moved = Result.unwrap(
    DesignDocument.moveNode(setupDeepFirstLabels(), "label", {
      parentName: "home",
      index: 2,
    }),
  );

  expect({
    inRow: contentsOf(childrenOf(moved, "row")),
    direct: contentsOf(childrenOf(moved, "home")).slice(1),
  }).toEqual({ inRow: [], direct: ["浅", "深"] });
});

test("同じ名前のノードが同じ並びに 2 つあるとき、差し替えは先の 1 つだけを置き換える", () => {
  const replaced = Result.unwrap(
    DesignDocument.replaceNode(setupSameLevelLabels(), "label", {
      name: "label",
      type: "Text",
      props: { content: "新" },
    }),
  );

  expect(contentsOf(childrenOf(replaced, "home"))).toEqual(["新", "後"]);
});

test("同じ名前のノードが同じ並びに 2 つあるとき、取り除きは先の 1 つだけを取り除く", () => {
  const removed = Result.unwrap(
    DesignDocument.removeNode(setupSameLevelLabels(), "label"),
  );

  expect(contentsOf(childrenOf(removed, "home"))).toEqual(["後"]);
});

test("同じ名前のノードが同じ並びに 2 つあるとき、名前の変更は先の 1 つだけを変え後ろは元の名前と props のまま", () => {
  const renamed = Result.unwrap(
    DesignDocument.rename(setupSameLevelLabels(), {
      from: "label",
      to: "title",
    }),
  );

  expect(
    childrenOf(renamed, "home").map((node) => [
      node.name,
      Node.isPrimitive(node) && node.props?.content,
    ]),
  ).toEqual([
    ["title", "先"],
    ["label", "後"],
  ]);
});

test("自分の子孫に同じ名前があるとき、名前の変更は外側だけを変える", () => {
  const document = setupDocument([
    {
      name: "panel",
      type: "Box",
      children: [{ name: "panel", type: "Box" }],
    },
  ]);

  const renamed = Result.unwrap(
    DesignDocument.rename(document, { from: "panel", to: "card" }),
  );

  expect(childrenOf(renamed, "card").map((node) => node.name)).toEqual([
    "panel",
  ]);
});

test("同じ名前の親が前の兄弟の子と直下にあるとき、挿入は findChildren が返す並びに入る", () => {
  const inserted = Result.unwrap(
    DesignDocument.insertNode(
      setupDeepFirstPanels(),
      { parentName: "panel", index: 0 },
      { name: "badge", type: "Text" },
    ),
  );

  expect(childrenOf(inserted, "panel").map((node) => node.name)).toEqual([
    "badge",
    "first",
    "second",
  ]);
});

test("同じ名前の親が前の兄弟の子と直下にあるとき、並べ替えは findChildren が返す並びを動かす", () => {
  const reordered = Result.unwrap(
    DesignDocument.reorderNode(
      setupDeepFirstPanels(),
      { parentName: "panel", index: 0 },
      1,
    ),
  );

  expect(childrenOf(reordered, "panel").map((node) => node.name)).toEqual([
    "second",
    "first",
  ]);
});

test("同じ名前の Box が同じ並びに 2 つあるとき、グループ解除は先の 1 つだけを外す", () => {
  const document = setupDocument([
    { name: "group", type: "Box", children: [{ name: "left", type: "Text" }] },
    { name: "group", type: "Box", children: [{ name: "right", type: "Text" }] },
  ]);

  const ungrouped = Result.unwrap(DesignDocument.ungroupBox(document, "group"));

  expect(
    childrenOf(ungrouped.document, "home").map((node) => node.name),
  ).toEqual(["left", "group"]);
});

test("同じ名前のノードが同じ並びに 2 つあるとき、部品化は先の 1 つだけを参照ノードにする", () => {
  const document = setupDocument([
    { name: "card", type: "Box", props: { gap: 1 } },
    { name: "card", type: "Box", props: { gap: 2 } },
  ]);

  const componentized = Result.unwrap(
    DesignDocument.createComponent(document, "card", "card-component"),
  );

  expect(childrenOf(componentized, "home").map(Node.isRef)).toEqual([
    true,
    false,
  ]);
});

test("同じ名前の artboard が 2 枚あるとき、props の編集は findArtboard が返す 1 枚だけに書かれる", () => {
  const edited = Result.unwrap(
    DesignDocument.applyPropEdit(setupDuplicatedArtboards(), "home", {
      names: ["fill"],
      value: Option.some("#ffffff"),
    }),
  );

  expect(edited.artboards.map((artboard) => artboard.props)).toEqual([
    { fill: "#ffffff" },
    undefined,
  ]);
});

test("同じ名前の artboard が 2 枚あるとき、リサイズは findArtboard が返す 1 枚だけを変える", () => {
  const resized = Result.unwrap(
    DesignDocument.resize(
      setupDuplicatedArtboards(),
      "home",
      ResizeEdit.create([AxisLength.create("width", 300)]),
    ),
  );

  expect(resized.artboards.map((artboard) => artboard.width)).toEqual([
    300, 200,
  ]);
});

test("同じ名前の artboard が 2 枚あるとき、置き直しは findArtboard が返す 1 枚だけを動かす", () => {
  const moved = Result.unwrap(
    DesignDocument.repositionArtboard(setupDuplicatedArtboards(), "home", {
      x: 900,
      y: 300,
    }),
  );

  expect(moved.artboards.map((artboard) => artboard.canvasPosition)).toEqual([
    { x: 900, y: 300 },
    undefined,
  ]);
});

test("同じ名前の artboard が 2 枚あるとき、名前の変更は findArtboard が返す 1 枚だけを変える", () => {
  const renamed = Result.unwrap(
    DesignDocument.rename(setupDuplicatedArtboards(), {
      from: "home",
      to: "top",
    }),
  );

  expect(DesignDocument.collectArtboardNames(renamed)).toEqual(["top", "home"]);
});

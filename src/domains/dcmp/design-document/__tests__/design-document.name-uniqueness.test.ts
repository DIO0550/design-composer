import { expect, test } from "vitest";
import type { Artboard } from "@/domains/dcmp/artboard";
import type { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

function setupDocument(children: readonly Node[]): DesignDocument {
  return DesignDocument.create({
    components: { card: { type: "Box" } },
    artboards: [{ name: "home", width: 360, height: 640, children }],
  });
}

function setupUniqueDocument(): DesignDocument {
  return setupDocument([
    { name: "row", type: "Box", children: [{ name: "title", type: "Text" }] },
    { name: "label", type: "Text" },
  ]);
}

// 名前が重複した不正なドキュメント
function setupDuplicatedDocument(): DesignDocument {
  return setupDocument([
    { name: "row", type: "Box", children: [{ name: "label", type: "Text" }] },
    { name: "label", type: "Text" },
  ]);
}

function setupArtboard(name: string, children: readonly Node[]): Artboard {
  return { name, width: 100, height: 100, children };
}

test("既にあるノードと同じ名前のノードを挿すと duplicate-name になる", () => {
  const result = DesignDocument.insertNode(
    setupUniqueDocument(),
    { parentName: "home", index: 0 },
    { name: "title", type: "Text" },
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "title" },
  });
});

test("挿すノードの子孫が既にある名前を持つと duplicate-name になる", () => {
  const result = DesignDocument.insertNode(
    setupUniqueDocument(),
    { parentName: "home", index: 0 },
    {
      name: "column",
      type: "Box",
      children: [{ name: "label", type: "Text" }],
    },
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "label" },
  });
});

test("新しい重複が 2 つできるとき、先に現れる名前の duplicate-name になる", () => {
  const result = DesignDocument.insertNode(
    setupUniqueDocument(),
    { parentName: "home", index: 0 },
    {
      name: "column",
      type: "Box",
      children: [
        { name: "title", type: "Text" },
        { name: "label", type: "Text" },
      ],
    },
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "title" },
  });
});

test("既にある名前のノードを範囲外の位置へ挿すと、位置の失敗が先に返る", () => {
  const result = DesignDocument.insertNode(
    setupUniqueDocument(),
    { parentName: "home", index: 5 },
    { name: "title", type: "Text" },
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "index-out-of-range", index: 5, length: 2 },
  });
});

test("既にある名前の artboard を範囲外の位置へ足すと、位置の失敗が先に返る", () => {
  const result = DesignDocument.insertArtboard(
    setupUniqueDocument(),
    5,
    setupArtboard("home", []),
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "index-out-of-range", index: 5, length: 1 },
  });
});

test("部品の名前と同じ名前のノードを挿すと duplicate-name になる", () => {
  const result = DesignDocument.insertNode(
    setupUniqueDocument(),
    { parentName: "home", index: 0 },
    { name: "card", type: "Box" },
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "card" },
  });
});

test("既に 2 つある名前のノードをもう 1 つ挿すと duplicate-name になる", () => {
  const result = DesignDocument.insertNode(
    setupDuplicatedDocument(),
    { parentName: "home", index: 0 },
    { name: "label", type: "Text" },
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "label" },
  });
});

test("名前が重複したドキュメントでも、使われていない名前のノードは挿せる", () => {
  const inserted = Result.unwrap(
    DesignDocument.insertNode(
      setupDuplicatedDocument(),
      { parentName: "home", index: 0 },
      { name: "caption", type: "Text" },
    ),
  );

  expect(Option.isSome(DesignDocument.findNode(inserted, "caption"))).toBe(
    true,
  );
});

test("既にある artboard と同じ名前の artboard を足すと duplicate-name になる", () => {
  const result = DesignDocument.insertArtboard(
    setupUniqueDocument(),
    1,
    setupArtboard("home", []),
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "home" },
  });
});

test("足す artboard の配下のノードが既にある名前を持つと duplicate-name になる", () => {
  const result = DesignDocument.insertArtboard(
    setupUniqueDocument(),
    1,
    setupArtboard("settings", [{ name: "title", type: "Text" }]),
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "title" },
  });
});

test("既に 2 つある名前のノードを配下に持つ artboard を足すと duplicate-name になる", () => {
  const result = DesignDocument.insertArtboard(
    setupDuplicatedDocument(),
    1,
    setupArtboard("settings", [{ name: "label", type: "Text" }]),
  );

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "label" },
  });
});

test("名前が重複したドキュメントでも、使われていない名前の artboard は足せる", () => {
  const inserted = Result.unwrap(
    DesignDocument.insertArtboard(
      setupDuplicatedDocument(),
      1,
      setupArtboard("settings", []),
    ),
  );

  expect(Option.isSome(DesignDocument.findArtboard(inserted, "settings"))).toBe(
    true,
  );
});

test("差し替え後のノードが別の既にある名前を持つと duplicate-name になる", () => {
  const result = DesignDocument.replaceNode(setupUniqueDocument(), "label", {
    name: "title",
    type: "Text",
  });

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "title" },
  });
});

test("差し替え後のノードが自分と同じ名前なら差し替えられる", () => {
  const replaced = Result.unwrap(
    DesignDocument.replaceNode(setupUniqueDocument(), "label", {
      name: "label",
      type: "Text",
      props: { content: "新" },
    }),
  );

  expect(DesignDocument.findNode(replaced, "label")).toEqual(
    Option.some({ name: "label", type: "Text", props: { content: "新" } }),
  );
});

test("既に 2 つある名前のノードを同じ名前のまま差し替えられる", () => {
  const replaced = Result.unwrap(
    DesignDocument.replaceNode(setupDuplicatedDocument(), "label", {
      name: "label",
      type: "Text",
      props: { content: "新" },
    }),
  );

  expect(DesignDocument.findNode(replaced, "label")).toEqual(
    Option.some({ name: "label", type: "Text", props: { content: "新" } }),
  );
});

test("既に 2 つある名前のノードを、同じ名前の子を足して差し替えると duplicate-name になる", () => {
  const result = DesignDocument.replaceNode(setupDuplicatedDocument(), "row", {
    name: "row",
    type: "Box",
    children: [
      { name: "label", type: "Text" },
      { name: "label", type: "Text" },
    ],
  });

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "label" },
  });
});

test("既に 2 つある名前のノードを別の親へ移せる", () => {
  const moved = Result.unwrap(
    DesignDocument.moveNode(setupDuplicatedDocument(), "label", {
      parentName: "home",
      index: 0,
    }),
  );

  expect(
    Option.map(DesignDocument.findChildren(moved, "row"), (children) =>
      children.map((child) => child.name),
    ),
  ).toEqual(Option.some([]));
});

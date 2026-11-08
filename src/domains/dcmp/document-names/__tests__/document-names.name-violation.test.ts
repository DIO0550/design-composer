import { expect, test } from "vitest";
import { DocumentNames } from "../index";

test("名前がすべて識別子の規則を満たすときは違反を返さない", () => {
  const violations = DocumentNames.collectNameViolations(
    { card: { type: "Box", children: [{ name: "label", type: "Text" }] } },
    [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "title", type: "Text" }],
      },
    ],
  );

  expect(violations).toEqual([]);
});

test("名前が空のノードは、入れ物の名前と兄弟の中の位置で欠落として返る", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    {
      name: "screen",
      width: 375,
      height: 812,
      children: [
        { name: "title", type: "Text" },
        { name: "", type: "Text" },
      ],
    },
  ]);

  expect(violations).toEqual([
    {
      kind: "missing",
      position: {
        kind: "child",
        owner: { kind: "named", name: "screen" },
        index: 1,
      },
    },
  ]);
});

test("name の無い（JSON 由来の）ノードも欠落として返る", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    {
      name: "screen",
      width: 375,
      height: 812,
      children: [
        // @ts-expect-error AI の直接編集による name 欠落（JSON 由来）を再現する
        { type: "Text" },
      ],
    },
  ]);

  expect(violations).toEqual([
    {
      kind: "missing",
      position: {
        kind: "child",
        owner: { kind: "named", name: "screen" },
        index: 0,
      },
    },
  ]);
});

test("名前が欠落したノードの子の欠落は、名前を持つ最も近い祖先を入れ物として返る", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    {
      name: "screen",
      width: 375,
      height: 812,
      children: [
        { name: "", type: "Box", children: [{ name: "", type: "Text" }] },
      ],
    },
  ]);

  expect(violations[1]).toEqual({
    kind: "missing",
    position: {
      kind: "child",
      owner: { kind: "named", name: "screen" },
      index: 0,
    },
  });
});

test("名前を持つ途中のノードの下の欠落は、そのノードを入れ物として返る", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    {
      name: "screen",
      width: 375,
      height: 812,
      children: [
        { name: "row", type: "Box", children: [{ name: "", type: "Text" }] },
      ],
    },
  ]);

  expect(violations).toEqual([
    {
      kind: "missing",
      position: {
        kind: "child",
        owner: { kind: "named", name: "row" },
        index: 0,
      },
    },
  ]);
});

test("名前を持つ祖先が無いノードの欠落は、その子を収める artboard の位置を入れ物として返る", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    { name: "screen", width: 375, height: 812, children: [] },
    {
      name: "",
      width: 375,
      height: 812,
      children: [{ name: "", type: "Text" }],
    },
  ]);

  expect(violations[1]).toEqual({
    kind: "missing",
    position: {
      kind: "child",
      owner: { kind: "artboard", index: 1 },
      index: 0,
    },
  });
});

test("名前の空なノードが続く深い子の欠落も、ルートの artboard の位置を入れ物として返る", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    {
      name: "",
      width: 375,
      height: 812,
      children: [
        {
          name: "",
          type: "Box",
          children: [
            { name: "title", type: "Text" },
            { name: "", type: "Text" },
          ],
        },
      ],
    },
  ]);

  expect(violations[2]).toEqual({
    kind: "missing",
    position: {
      kind: "child",
      owner: { kind: "artboard", index: 0 },
      index: 1,
    },
  });
});

test("名前を持つ祖先が無い部品内部のノードの欠落は、部品のキーの位置を入れ物として返る", () => {
  const violations = DocumentNames.collectNameViolations(
    { "": { type: "Box", children: [{ name: "", type: "Text" }] } },
    [],
  );

  expect(violations[1]).toEqual({
    kind: "missing",
    position: { kind: "child", owner: { kind: "component-key" }, index: 0 },
  });
});

test("名前の無い artboard の下でも、名前を持つ途中のノードがあればそのノードを入れ物として返る", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    {
      name: "",
      width: 375,
      height: 812,
      children: [
        { name: "row", type: "Box", children: [{ name: "", type: "Text" }] },
      ],
    },
  ]);

  expect(violations[1]).toEqual({
    kind: "missing",
    position: {
      kind: "child",
      owner: { kind: "named", name: "row" },
      index: 0,
    },
  });
});

test("name の無い（JSON 由来の）artboard の子の欠落も、その artboard の位置を入れ物として返る", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    // @ts-expect-error AI の直接編集による name 欠落（JSON 由来）を再現する
    {
      width: 375,
      height: 812,
      children: [{ name: "", type: "Text" }],
    },
  ]);

  expect(violations[1]).toEqual({
    kind: "missing",
    position: {
      kind: "child",
      owner: { kind: "artboard", index: 0 },
      index: 0,
    },
  });
});

test("部品内部のノードの欠落は、部品名を入れ物として返る", () => {
  const violations = DocumentNames.collectNameViolations(
    { card: { type: "Box", children: [{ name: "", type: "Text" }] } },
    [],
  );

  expect(violations).toEqual([
    {
      kind: "missing",
      position: {
        kind: "child",
        owner: { kind: "named", name: "card" },
        index: 0,
      },
    },
  ]);
});

test("名前が空の artboard は、artboards の中の位置で欠落として返る", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    { name: "screen", width: 375, height: 812, children: [] },
    { name: "", width: 375, height: 812, children: [] },
  ]);

  expect(violations).toEqual([
    { kind: "missing", position: { kind: "artboard", index: 1 } },
  ]);
});

test("キーが空の部品は、部品のキーの欠落として返る", () => {
  const violations = DocumentNames.collectNameViolations(
    { "": { type: "Box" } },
    [],
  );

  expect(violations).toEqual([
    { kind: "missing", position: { kind: "component-key" } },
  ]);
});

test("識別子の規則を満たさないノード名は、その名前で返る", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    {
      name: "screen",
      width: 375,
      height: 812,
      children: [{ name: "LoginForm", type: "Box" }],
    },
  ]);

  expect(violations).toEqual([
    { kind: "invalid-identifier", name: "LoginForm" },
  ]);
});

test("識別子の規則を満たさない部品名は、その名前で返る", () => {
  const violations = DocumentNames.collectNameViolations(
    { PrimaryButton: { type: "Box" } },
    [],
  );

  expect(violations).toEqual([
    { kind: "invalid-identifier", name: "PrimaryButton" },
  ]);
});

test("識別子の規則を満たさない artboard 名は、その名前で返る", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    { name: "Login Screen", width: 375, height: 812, children: [] },
  ]);

  expect(violations).toEqual([
    { kind: "invalid-identifier", name: "Login Screen" },
  ]);
});

test("欠落した名前は識別子の規則違反としては返らない", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    {
      name: "screen",
      width: 375,
      height: 812,
      children: [{ name: "", type: "Text" }],
    },
  ]);

  expect(violations.map((violation) => violation.kind)).toEqual(["missing"]);
});

test("部品の違反は artboard の違反より先に並ぶ", () => {
  const violations = DocumentNames.collectNameViolations(
    { Card: { type: "Box" } },
    [{ name: "Screen", width: 375, height: 812, children: [] }],
  );

  expect(violations).toEqual([
    { kind: "invalid-identifier", name: "Card" },
    { kind: "invalid-identifier", name: "Screen" },
  ]);
});

test("入れ物の中の違反は行きがけ順に並ぶ", () => {
  const violations = DocumentNames.collectNameViolations({}, [
    {
      name: "screen",
      width: 375,
      height: 812,
      children: [
        {
          name: "Row",
          type: "Box",
          children: [{ name: "Title", type: "Text" }],
        },
        { name: "Footer", type: "Box" },
      ],
    },
  ]);

  expect(violations).toEqual([
    { kind: "invalid-identifier", name: "Row" },
    { kind: "invalid-identifier", name: "Title" },
    { kind: "invalid-identifier", name: "Footer" },
  ]);
});

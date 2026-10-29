import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { Node, Props } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { propsOf } from "./group-setup";

/*
 * 同じ親の兄弟をまとめて包むときに、Box が親と兄弟から引き継ぐ指定（docs/06-ui.md
 * 「複数選択」のグループ化）。木の付け替えそのものは `design-document.group-siblings.test.ts`
 * が持つ。
 */

/**
 * 画面の直下に、props を書いた panel を置き、その中にノードを並べたドキュメント。
 *
 * @param panelProps panel に書く props
 * @param children panel の中に並べるノード
 * @returns 1 つの artboard だけを持つドキュメント
 */
function setupDocument(
  panelProps: Props,
  children: readonly Node[],
): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "panel", type: "Box", props: panelProps, children }],
      },
    ],
  });
}

/** panel の中で包む、フローの Text 2 つ。 */
const FlowPair: readonly Node[] = [
  { name: "first", type: "Text" },
  { name: "second", type: "Text" },
];

/**
 * panel の中の first と second をまとめて包む。
 *
 * @param document 包む先のドキュメント
 * @returns 包んだあとのドキュメント
 */
function groupPair(document: DesignDocument): DesignDocument {
  return Result.unwrap(
    DesignDocument.groupIntoBox(document, ["first", "second"], "box"),
  );
}

test("layout: row の親の中のフローの兄弟を包むと、Box も row で並べる", () => {
  const grouped = groupPair(setupDocument({ layout: "row" }, FlowPair));

  expect(propsOf(grouped, "box")).toEqual({ layout: "row" });
});

test("親に書かれた gap / align を Box も持つ", () => {
  const grouped = groupPair(
    setupDocument({ gap: "md", align: "center", paddingTop: "lg" }, FlowPair),
  );

  expect(propsOf(grouped, "box")).toEqual({ gap: "md", align: "center" });
});

test("artboard の直下のフローの兄弟を包むと、artboard に書かれた layout / gap を Box が持つ", () => {
  const document = DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: { layout: "row", gap: "sm" },
        children: FlowPair,
      },
    ],
  });

  const grouped = groupPair(document);

  expect(propsOf(grouped, "box")).toEqual({ layout: "row", gap: "sm" });
});

test("layout: free の親の中のフローの兄弟を包むと、Box も free になる", () => {
  const grouped = groupPair(setupDocument({ layout: "free" }, FlowPair));

  expect(propsOf(grouped, "box")).toEqual({ layout: "free" });
});

test("親に何も書かれていなければ、フローで fill を持たない兄弟を包んだ Box は props を持たない", () => {
  const grouped = groupPair(setupDocument({}, FlowPair));
  const box = Option.unwrap(DesignDocument.findNode(grouped, "box"));

  expect("props" in box).toBe(false);
});

test("兄弟のうち 1 つでも幅が fill なら Box の幅も fill になり、下限・上限は写さない", () => {
  const filled = groupPair(
    setupDocument({}, [
      {
        name: "first",
        type: "Text",
        props: { widthMode: "fill", minWidth: 120, maxWidth: 320 },
      },
      { name: "second", type: "Text" },
    ]),
  );
  const unfilled = groupPair(
    setupDocument({}, [
      { name: "first", type: "Text", props: { widthMode: "hug" } },
      { name: "second", type: "Text" },
    ]),
  );

  expect([propsOf(filled, "box"), propsOf(unfilled, "box")]).toEqual([
    { widthMode: "fill" },
    {},
  ]);
});

test("絶対配置の兄弟をまとめて包むと、Box はそれらの各軸の最小の座標に絶対配置で置かれる", () => {
  const grouped = groupPair(
    setupDocument({}, [
      {
        name: "first",
        type: "Text",
        props: { placement: "absolute", x: 40, y: 10 },
      },
      {
        name: "second",
        type: "Text",
        props: { placement: "absolute", x: 20, y: 30 },
      },
    ]),
  );

  expect(propsOf(grouped, "box")).toEqual({
    placement: "absolute",
    x: 20,
    y: 10,
  });
});

test("絶対配置の兄弟をまとめて包むと、兄弟は絶対配置のまま Box の座標を引いた位置になる", () => {
  const grouped = groupPair(
    setupDocument({}, [
      {
        name: "first",
        type: "Text",
        props: { placement: "absolute", x: 40, y: 10 },
      },
      {
        name: "second",
        type: "Text",
        props: { placement: "absolute", x: 20, y: 30 },
      },
    ]),
  );

  expect([propsOf(grouped, "first"), propsOf(grouped, "second")]).toEqual([
    { placement: "absolute", x: 20, y: 0 },
    { placement: "absolute", x: 0, y: 20 },
  ]);
});

test("絶対配置の兄弟の追従が軸ごとに揃っていれば Box も同じ追従を持ち、揃っていない軸は持たない", () => {
  const grouped = groupPair(
    setupDocument({}, [
      {
        name: "first",
        type: "Text",
        props: {
          placement: "absolute",
          x: 0,
          y: 0,
          constraintX: "max",
          constraintY: "center",
        },
      },
      {
        name: "second",
        type: "Text",
        props: {
          placement: "absolute",
          x: 0,
          y: 0,
          constraintX: "max",
          constraintY: "stretch",
        },
      },
    ]),
  );

  expect(propsOf(grouped, "box")).toEqual({
    placement: "absolute",
    x: 0,
    y: 0,
    constraintX: "max",
  });
});

test("絶対配置の兄弟をまとめて包んでから外すと、元の座標と追従に戻る", () => {
  const document = setupDocument({}, [
    {
      name: "first",
      type: "Text",
      props: { placement: "absolute", x: 40, y: 10, constraintX: "max" },
    },
    {
      name: "second",
      type: "Text",
      props: { placement: "absolute", x: 20, y: 30, constraintY: "center" },
    },
  ]);

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(groupPair(document), "box"),
  );

  expect(ungrouped).toEqual(document);
});

test("絶対配置とフローの兄弟が混ざっていると包めない", () => {
  const absoluteFirst: Node = {
    name: "first",
    type: "Text",
    props: { placement: "absolute", x: 40, y: 10 },
  };
  const mixed = setupDocument({}, [absoluteFirst, FlowPair[1]]);
  const flow = setupDocument({}, FlowPair);

  expect([
    DesignDocument.groupIntoBox(mixed, ["first", "second"], "box"),
    Result.isOk(DesignDocument.groupIntoBox(flow, ["first", "second"], "box")),
  ]).toStrictEqual([Result.err({ kind: "mixed-placement" }), true]);
});

test("部品インスタンスと絶対配置の兄弟が混ざっていると包めない", () => {
  const document = setupDocument({}, [
    {
      name: "first",
      type: "Text",
      props: { placement: "absolute", x: 40, y: 10 },
    },
    { name: "second", ref: "primary-button" },
  ]);

  expect(
    DesignDocument.groupIntoBox(document, ["first", "second"], "box"),
  ).toStrictEqual(Result.err({ kind: "mixed-placement" }));
});

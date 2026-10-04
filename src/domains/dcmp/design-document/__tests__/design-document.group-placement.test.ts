import { expect, test } from "vitest";
import type { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";
import { propsOf } from "./group-setup";

/*
 * 包む / 外すときに、配置（docs/03「配置の指定」の 5 prop）を Box と子の間で受け渡す
 * （docs/06-ui.md「編集操作の一覧」のグループ化・グループ解除）。木の付け替えそのものは
 * `design-document.group.test.ts` が持つ。
 */

/**
 * 画面の直下にノードを並べたドキュメント。
 *
 * @param children 画面の直下に並べるノード
 * @returns 1 つの artboard だけを持つドキュメント
 */
function setupDocument(children: readonly Node[]): DesignDocument {
  return DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children }],
  });
}

test("絶対配置のノードを包むと、Box がそのノードの配置を持つ", () => {
  const document = setupDocument([
    {
      name: "title",
      type: "Text",
      props: {
        placement: "absolute",
        x: 24,
        y: 48,
        constraintX: "max",
        constraintY: "center",
      },
    },
  ]);

  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(document, "title", "box"),
  );

  expect(propsOf(grouped, "box")).toEqual({
    placement: "absolute",
    x: 24,
    y: 48,
    constraintX: "max",
    constraintY: "center",
  });
});

test("絶対配置のノードを包むと、包まれたノードは配置の prop を持たなくなり、それ以外の props は残る", () => {
  const document = setupDocument([
    {
      name: "title",
      type: "Text",
      props: {
        placement: "absolute",
        x: 24,
        y: 48,
        constraintX: "max",
        content: "見出し",
      },
    },
  ]);

  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(document, "title", "box"),
  );

  expect(propsOf(grouped, "title")).toEqual({ content: "見出し" });
});

test("フローのノードを包んでも、ノードに書かれた座標はそのまま残り、Box は座標を持たない", () => {
  const document = setupDocument([
    {
      name: "title",
      type: "Text",
      props: { placement: "flow", x: 24, y: 48 },
    },
  ]);

  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(document, "title", "box"),
  );

  expect([propsOf(grouped, "box"), propsOf(grouped, "title")]).toEqual([
    {},
    { placement: "flow", x: 24, y: 48 },
  ]);
});

test("絶対配置の Box を外すと、絶対配置の子の座標に Box の座標が足される", () => {
  const document = setupDocument([
    {
      name: "box",
      type: "Box",
      props: { placement: "absolute", x: 100, y: 200 },
      children: [
        {
          name: "badge",
          type: "Ellipse",
          props: { placement: "absolute", x: 10, y: 20 },
        },
      ],
    },
  ]);

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(propsOf(ungrouped, "badge")).toEqual({
    placement: "absolute",
    x: 110,
    y: 220,
  });
});

test("絶対配置の Box を外しても、絶対配置の子の追従は子のものが残る", () => {
  const document = setupDocument([
    {
      name: "box",
      type: "Box",
      props: {
        placement: "absolute",
        x: 100,
        y: 200,
        constraintX: "scale",
        constraintY: "stretch",
      },
      children: [
        {
          name: "badge",
          type: "Ellipse",
          props: {
            placement: "absolute",
            x: 10,
            y: 20,
            constraintX: "max",
            constraintY: "center",
          },
        },
      ],
    },
  ]);

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(propsOf(ungrouped, "badge")).toMatchObject({
    constraintX: "max",
    constraintY: "center",
  });
});

test("絶対配置の Box の中のフローの子が 1 つだけなら、外すとその子が Box の配置を持つ", () => {
  const document = setupDocument([
    {
      name: "box",
      type: "Box",
      props: {
        placement: "absolute",
        x: 100,
        y: 200,
        constraintX: "max",
        constraintY: "center",
      },
      children: [
        { name: "title", type: "Text", props: { content: "見出し" } },
        {
          name: "badge",
          type: "Ellipse",
          props: { placement: "absolute", x: 10, y: 20 },
        },
      ],
    },
  ]);

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(propsOf(ungrouped, "title")).toEqual({
    content: "見出し",
    placement: "absolute",
    x: 100,
    y: 200,
    constraintX: "max",
    constraintY: "center",
  });
});

test("フローの子に古い追従が残っていても、外したあとの子の配置は Box と同じになる", () => {
  const document = setupDocument([
    {
      name: "box",
      type: "Box",
      props: { placement: "absolute", x: 100, y: 200 },
      children: [
        { name: "title", type: "Text", props: { constraintX: "scale" } },
      ],
    },
  ]);

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(propsOf(ungrouped, "title")).toEqual({
    placement: "absolute",
    x: 100,
    y: 200,
  });
});

test("絶対配置の Box の中にフローの子が 2 つ以上あると、外してもフローの子は配置を持たない", () => {
  const document = setupDocument([
    {
      name: "box",
      type: "Box",
      props: { placement: "absolute", x: 100, y: 200 },
      children: [
        { name: "first", type: "Text", props: { content: "1" } },
        { name: "second", type: "Text", props: { content: "2" } },
      ],
    },
  ]);

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect([propsOf(ungrouped, "first"), propsOf(ungrouped, "second")]).toEqual([
    { content: "1" },
    { content: "2" },
  ]);
});

test("絶対配置の Box の唯一の子が部品インスタンスなら、外してもインスタンスは配置を持たない", () => {
  const document = DesignDocument.create({
    components: { Button: { type: "Box" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "box",
            type: "Box",
            props: { placement: "absolute", x: 100, y: 200 },
            children: [{ name: "cta", ref: "Button" }],
          },
        ],
      },
    ],
  });

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(ungrouped.artboards[0].children).toEqual([
    { name: "cta", ref: "Button" },
  ]);
});

test("フローの子が 1 つでもインスタンスと並んでいれば、外してもその子は配置を持たない", () => {
  const document = DesignDocument.create({
    components: { Button: { type: "Box" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "box",
            type: "Box",
            props: { placement: "absolute", x: 100, y: 200 },
            children: [
              { name: "title", type: "Text", props: { content: "見出し" } },
              { name: "cta", ref: "Button" },
            ],
          },
        ],
      },
    ],
  });

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(propsOf(ungrouped, "title")).toEqual({ content: "見出し" });
});

test("フローの Box を外すと、唯一のフローの子の props は変わらない", () => {
  const document = setupDocument([
    {
      name: "box",
      type: "Box",
      props: { placement: "flow", x: 100, y: 200 },
      children: [
        { name: "title", type: "Text", props: { constraintX: "scale" } },
      ],
    },
  ]);

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(propsOf(ungrouped, "title")).toEqual({ constraintX: "scale" });
});

test("フローの Box を外すと、絶対配置の子の座標は変わらない", () => {
  const document = setupDocument([
    {
      name: "box",
      type: "Box",
      props: { placement: "flow", x: 100, y: 200 },
      children: [
        {
          name: "badge",
          type: "Ellipse",
          props: { placement: "absolute", x: 10, y: 20 },
        },
      ],
    },
  ]);

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(propsOf(ungrouped, "badge")).toEqual({
    placement: "absolute",
    x: 10,
    y: 20,
  });
});

test("絶対配置のノードを包んでから外すと、元のノードに戻る", () => {
  const title = {
    name: "title",
    type: "Box",
    props: {
      placement: "absolute",
      x: 24,
      y: 48,
      constraintX: "max",
      constraintY: "center",
      widthMode: "fill",
      maxWidth: 320,
      paddingTop: "md",
    },
    children: [],
  };
  const document = setupDocument([title]);

  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(document, "title", "box"),
  );
  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(grouped, "box"),
  );

  expect(Option.unwrap(DesignDocument.findNode(ungrouped, "title"))).toEqual(
    title,
  );
});

import { expect, test } from "vitest";
import { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/*
 * 選択を Box で包む / 包んでいた Box を外す（docs/06-ui.md「編集操作の一覧」のグループ化・
 * グループ解除）。ここで見るのは木の付け替えだけで、どれを対象にするかと選択の付け替えは
 * `editor-state.group.test.ts` が持つ。
 */

test("ノードを包むと、そのノードが居た位置に新しい Box が入り、ノードはその唯一の子になる", () => {
  const title = { name: "title", type: "Text" };
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [title] }],
  });

  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(document, "title", "box"),
  );

  expect(grouped.artboards[0].children).toEqual([
    { name: "box", type: "Box", children: [title] },
  ]);
});

test("包んでも前後の兄弟の並び順は変わらない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "before", type: "Text" },
          { name: "target", type: "Text" },
          { name: "after", type: "Text" },
        ],
      },
    ],
  });

  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(document, "target", "box"),
  );

  expect(grouped.artboards[0].children.map((child) => child.name)).toEqual([
    "before",
    "box",
    "after",
  ]);
});

test("入れ子の中にいるノードも包める", () => {
  const label = { name: "label", type: "Text" };
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "panel", type: "Box", children: [label] }],
      },
    ],
  });

  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(document, "label", "box"),
  );

  expect(grouped.artboards[0].children).toEqual([
    {
      name: "panel",
      type: "Box",
      children: [{ name: "box", type: "Box", children: [label] }],
    },
  ]);
});

test("包んで作られた Box は props を持たない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "title", type: "Text" }],
      },
    ],
  });

  const grouped = Result.unwrap(
    DesignDocument.groupIntoBox(document, "title", "box"),
  );
  const box = Option.unwrap(DesignDocument.findNode(grouped, "box"));

  expect(Node.isPrimitive(box) && box.props).toBeUndefined();
});

test("Box を外すと、その子が Box の居た位置へ同じ順で並ぶ", () => {
  const first = { name: "first", type: "Text" };
  const second = { name: "second", type: "Text" };
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "box", type: "Box", children: [first, second] }],
      },
    ],
  });

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(ungrouped.artboards[0].children).toEqual([first, second]);
});

test("入れ子の中にある Box も外せる", () => {
  const label = { name: "label", type: "Text" };
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "outer",
            type: "Box",
            children: [{ name: "inner", type: "Box", children: [label] }],
          },
        ],
      },
    ],
  });

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "inner"),
  );

  expect(ungrouped.artboards[0].children).toEqual([
    { name: "outer", type: "Box", children: [label] },
  ]);
});

test("Box を外しても前後の兄弟の並び順は変わらない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "before", type: "Text" },
          {
            name: "box",
            type: "Box",
            children: [{ name: "child", type: "Text" }],
          },
          { name: "after", type: "Text" },
        ],
      },
    ],
  });

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(ungrouped.artboards[0].children.map((child) => child.name)).toEqual([
    "before",
    "child",
    "after",
  ]);
});

test("子が無い Box を外すと、その Box だけが消える", () => {
  const keep = { name: "keep", type: "Text" };
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [keep, { name: "box", type: "Box", children: [] }],
      },
    ],
  });

  const { document: ungrouped } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(ungrouped.artboards[0].children).toEqual([keep]);
});

test("Box を外すと、親へ戻った子の名前が同じ順で返る", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "box",
            type: "Box",
            children: [
              { name: "first", type: "Text" },
              { name: "second", type: "Text" },
            ],
          },
        ],
      },
    ],
  });

  const { freedNames } = Result.unwrap(
    DesignDocument.ungroupBox(document, "box"),
  );

  expect(freedNames).toEqual(["first", "second"]);
});

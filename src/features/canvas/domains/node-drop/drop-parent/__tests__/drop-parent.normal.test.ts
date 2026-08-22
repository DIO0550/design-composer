import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import type { DraggedNode } from "@/features/canvas/domains/node-drop";
import { Option } from "@/utils/Option";
import { DropParent } from "../index";

/** 木にある既存ノードを運んでいる状態。名前で指す。 */
function moving(name: string): DraggedNode {
  return { kind: "existing", name };
}

/** パレットの雛形を運んでいる状態。まだ木に無いので何も占めていない。 */
const placingBox: DraggedNode = {
  kind: "new",
  template: { kind: "primitive", type: "Box" },
};

/**
 * `home` の下に、子を持てる `body`（縦積み）と `row`（横並び）、
 * 子を持てない `title`、部品インスタンスの `login` が並ぶドキュメント。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: {
      "primary-button": {
        type: "Box",
        children: [{ name: "label", type: "Text" }],
      },
    },
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          {
            name: "body",
            type: "Box",
            children: [{ name: "card", type: "Box", children: [] }],
          },
          {
            name: "row",
            type: "Box",
            props: { direction: "row" },
            children: [],
          },
          { name: "login", ref: "primary-button" },
          { name: "moved", type: "Text" },
        ],
      },
    ],
  });
}

test("Box の上へ運ぶとその Box が受け入れ先になる", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "card",
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("card");
});

test("子を持てない Text の上へ運ぶと外側の Box が受け入れ先になる", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "title",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("部品インスタンスの上へ運ぶと外側の artboard が受け入れ先になる", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "login",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("部品定義の中身の名前は受け入れ先にならない", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "label",
    "login",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("運んでいるノード自身は受け入れ先にならない", () => {
  const parent = DropParent.innermost(setupDocument(), moving("body"), [
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("運んでいるノードの子孫は受け入れ先にならない", () => {
  const parent = DropParent.innermost(setupDocument(), moving("body"), [
    "card",
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("受け入れられる候補が1つも無ければ受け入れ先は決まらない", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "title",
  ]);

  expect(parent.some).toBe(false);
});

test("ドキュメントに無いノードを運んでいるときは受け入れ先が決まらない", () => {
  const parent = DropParent.innermost(setupDocument(), moving("unknown"), [
    "home",
  ]);

  expect(parent.some).toBe(false);
});

test("direction を指定していない Box は縦に子が並ぶものとして扱われる", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "body",
  ]);

  expect(Option.unwrap(parent).direction).toBe("column");
});

test("direction が row の Box は横に子が並ぶものとして扱われる", () => {
  const parent = DropParent.innermost(setupDocument(), moving("moved"), [
    "row",
  ]);

  expect(Option.unwrap(parent).direction).toBe("row");
});

test("雛形を運んでいるときは、掴んでいるノードが無くても最も内側の Box が受け入れ先になる", () => {
  const parent = DropParent.innermost(setupDocument(), placingBox, [
    "card",
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("card");
});

test("雛形を運んでいるときは、木のどのノードも受け入れ先から外れない", () => {
  // 既存ノードなら自分自身は外れる（上の「運んでいるノード自身は受け入れ先にならない」）。
  // 雛形は何も占めていないので、同じ `body` がそのまま受け入れ先になる
  const parent = DropParent.innermost(setupDocument(), placingBox, [
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("body");
});

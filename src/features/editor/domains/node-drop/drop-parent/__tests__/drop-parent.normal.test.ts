import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { DropParent } from "../index";

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
  const parent = DropParent.innermost(setupDocument(), "moved", [
    "card",
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("card");
});

test("子を持てない Text の上へ運ぶと外側の Box が受け入れ先になる", () => {
  const parent = DropParent.innermost(setupDocument(), "moved", [
    "title",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("部品インスタンスの上へ運ぶと外側の artboard が受け入れ先になる", () => {
  const parent = DropParent.innermost(setupDocument(), "moved", [
    "login",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("部品定義の中身の名前は受け入れ先にならない", () => {
  const parent = DropParent.innermost(setupDocument(), "moved", [
    "label",
    "login",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("運んでいるノード自身は受け入れ先にならない", () => {
  const parent = DropParent.innermost(setupDocument(), "body", [
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("運んでいるノードの子孫は受け入れ先にならない", () => {
  const parent = DropParent.innermost(setupDocument(), "body", [
    "card",
    "body",
    "home",
  ]);

  expect(Option.unwrap(parent).name).toBe("home");
});

test("受け入れられる候補が1つも無ければ受け入れ先は決まらない", () => {
  const parent = DropParent.innermost(setupDocument(), "moved", ["title"]);

  expect(parent.some).toBe(false);
});

test("ドキュメントに無いノードを運んでいるときは受け入れ先が決まらない", () => {
  const parent = DropParent.innermost(setupDocument(), "unknown", ["home"]);

  expect(parent.some).toBe(false);
});

test("direction を指定していない Box は縦に子が並ぶものとして扱われる", () => {
  const parent = DropParent.innermost(setupDocument(), "moved", ["body"]);

  expect(Option.unwrap(parent).direction).toBe("column");
});

test("direction が row の Box は横に子が並ぶものとして扱われる", () => {
  const parent = DropParent.innermost(setupDocument(), "moved", ["row"]);

  expect(Option.unwrap(parent).direction).toBe("row");
});

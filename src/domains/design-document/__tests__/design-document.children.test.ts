import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { DesignDocument } from "../index";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: { card: { type: "Box" } },
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
            children: [{ name: "body-text", type: "Text" }],
          },
          { name: "panel", type: "Box", children: [] },
          { name: "home-card", ref: "card" },
        ],
      },
    ],
  });
}

test("artboard の名前を渡すと直下の子の並びを答える", () => {
  const children = Option.unwrap(
    DesignDocument.findChildren(setupDocument(), "home"),
  );

  expect(children.map((child) => child.name)).toEqual([
    "title",
    "body",
    "panel",
    "home-card",
  ]);
});

test("子を持てるノードの名前を渡すとそのノードの子の並びを答える", () => {
  const children = Option.unwrap(
    DesignDocument.findChildren(setupDocument(), "body"),
  );

  expect(children.map((child) => child.name)).toEqual(["body-text"]);
});

test("子を持てるが子が1つも無いノードは空の並びを答える", () => {
  expect(DesignDocument.findChildren(setupDocument(), "panel")).toEqual(
    Option.some([]),
  );
});

test("子を持てない Text には子の並びが無い", () => {
  expect(DesignDocument.findChildren(setupDocument(), "title")).toEqual(
    Option.none,
  );
});

test("参照ノードには子の並びが無い", () => {
  expect(DesignDocument.findChildren(setupDocument(), "home-card")).toEqual(
    Option.none,
  );
});

test("ドキュメントに無い名前には子の並びが無い", () => {
  expect(DesignDocument.findChildren(setupDocument(), "missing")).toEqual(
    Option.none,
  );
});

test("部品定義は artboard の木に無いため子の並びが無い", () => {
  expect(DesignDocument.findChildren(setupDocument(), "card")).toEqual(
    Option.none,
  );
});

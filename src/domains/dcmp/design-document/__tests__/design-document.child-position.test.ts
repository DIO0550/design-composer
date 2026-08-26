import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { DesignDocument } from "../index";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
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
            children: [
              { name: "lead", type: "Text" },
              { name: "note", type: "Text" },
            ],
          },
        ],
      },
      { name: "settings", width: 375, height: 812, children: [] },
    ],
  });
}

test("artboard の直下にあるノードは artboard を親とする位置で返る", () => {
  expect(
    Option.unwrap(DesignDocument.findChildPosition(setupDocument(), "title")),
  ).toEqual({ parentName: "home", index: 0 });
});

test("子孫にあるノードはその直接の親を親とする位置で返る", () => {
  expect(
    Option.unwrap(DesignDocument.findChildPosition(setupDocument(), "note")),
  ).toEqual({ parentName: "body", index: 1 });
});

test("artboard 自身は誰の子でもないため位置を持たない", () => {
  expect(DesignDocument.findChildPosition(setupDocument(), "home").some).toBe(
    false,
  );
});

test("ドキュメントに無い名前は位置を持たない", () => {
  expect(
    DesignDocument.findChildPosition(setupDocument(), "unknown").some,
  ).toBe(false);
});

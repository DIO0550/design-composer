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
          { name: "home-card", ref: "card" },
        ],
      },
    ],
  });
}

test("artboard の子として足す位置は今の子の数になる", () => {
  expect(DesignDocument.appendPositionOf(setupDocument(), "home")).toEqual(
    Option.some({ parentName: "home", index: 3 }),
  );
});

test("子を持てるノードの子として足す位置はそのノードの子の末尾になる", () => {
  expect(DesignDocument.appendPositionOf(setupDocument(), "body")).toEqual(
    Option.some({ parentName: "body", index: 1 }),
  );
});

test("子を持てない Text には足せる位置が無い", () => {
  expect(DesignDocument.appendPositionOf(setupDocument(), "title")).toEqual(
    Option.none,
  );
});

test("参照ノードには足せる位置が無い", () => {
  expect(DesignDocument.appendPositionOf(setupDocument(), "home-card")).toEqual(
    Option.none,
  );
});

test("ドキュメントに無い名前には足せる位置が無い", () => {
  expect(DesignDocument.appendPositionOf(setupDocument(), "missing")).toEqual(
    Option.none,
  );
});

test("部品定義は artboard の木に無いため足せる位置が無い", () => {
  expect(DesignDocument.appendPositionOf(setupDocument(), "card")).toEqual(
    Option.none,
  );
});

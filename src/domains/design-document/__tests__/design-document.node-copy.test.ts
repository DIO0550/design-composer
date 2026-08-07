import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/** ノード 1 つを持つ artboard。コピー元がドキュメントに残っている状態を作る。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "label", type: "Text" }],
      },
    ],
  });
}

test("ドキュメントに残っているノードの複製を挿すと連番の名前が付く", () => {
  const document = setupDocument();

  const result = Result.unwrap(
    DesignDocument.insertNodeCopy(
      document,
      { parentName: "screen", index: 1 },
      { name: "label", type: "Text" },
    ),
  );

  expect(result.artboards[0].children).toEqual([
    { name: "label", type: "Text" },
    { name: "label-2", type: "Text" },
  ]);
});

test("複製を挿しても名前は重複しない", () => {
  const document = setupDocument();

  const result = Result.unwrap(
    DesignDocument.insertNodeCopy(
      document,
      { parentName: "screen", index: 1 },
      { name: "label", type: "Text" },
    ),
  );

  expect(DesignDocument.collectErrors(result)).toEqual([]);
});

test("子孫を持つノードの複製を挿すと子孫の名前も付け替わる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "card",
            type: "Box",
            children: [{ name: "label", type: "Text" }],
          },
        ],
      },
    ],
  });

  const result = Result.unwrap(
    DesignDocument.insertNodeCopy(
      document,
      { parentName: "screen", index: 1 },
      {
        name: "card",
        type: "Box",
        children: [{ name: "label", type: "Text" }],
      },
    ),
  );

  expect(result.artboards[0].children[1]).toEqual({
    name: "card-2",
    type: "Box",
    children: [{ name: "label-2", type: "Text" }],
  });
});

test("部品インスタンスの複製を挿しても参照先の部品名は変わらない", () => {
  const document = DesignDocument.create({
    components: { "primary-button": { type: "Box" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "primary-button-1", ref: "primary-button" }],
      },
    ],
  });

  const result = Result.unwrap(
    DesignDocument.insertNodeCopy(
      document,
      { parentName: "screen", index: 1 },
      { name: "primary-button-1", ref: "primary-button" },
    ),
  );

  expect(result.artboards[0].children[1]).toEqual({
    name: "primary-button-1-2",
    ref: "primary-button",
  });
});

test("ドキュメントに無い名前のノードの複製を挿すとその名前のまま入る", () => {
  const document = setupDocument();

  const result = Result.unwrap(
    DesignDocument.insertNodeCopy(
      document,
      { parentName: "screen", index: 1 },
      { name: "caption", type: "Text" },
    ),
  );

  expect(result.artboards[0].children[1]).toEqual({
    name: "caption",
    type: "Text",
  });
});

test("子を持てないノードの下へ複製を挿そうとすると失敗する", () => {
  const document = setupDocument();

  const result = DesignDocument.insertNodeCopy(
    document,
    { parentName: "label", index: 0 },
    { name: "label", type: "Text" },
  );

  expect(result.ok).toBe(false);
});

test("insertNodeCopy は元のドキュメントを変更しない", () => {
  const document = setupDocument();

  DesignDocument.insertNodeCopy(
    document,
    { parentName: "screen", index: 1 },
    { name: "label", type: "Text" },
  );

  expect(document.artboards[0].children).toEqual([
    { name: "label", type: "Text" },
  ]);
});

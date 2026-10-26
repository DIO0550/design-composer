import { expect, expectTypeOf, test } from "vitest";
import { Result } from "@/utils/Result";
import { DesignDocument, DocumentTemplate } from "../index";

/*
 * ノードの複製をツリー上の位置から並べて挿す（docs/06-ui.md「編集操作の一覧」と「複数選択」の
 * コピー & ペースト）。
 */

/**
 * `screen` に Text を 2 つ持つドキュメント。`label` はコピー元がドキュメントに残っている状態を
 * 作り、後ろの `footer` は末尾へ足すだけの実装と区別するために置く。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "label", type: "Text" },
          { name: "footer", type: "Text" },
        ],
      },
    ],
  });
}

/**
 * 部品インスタンスを 1 つだけ持つドキュメント。インスタンスの複製の元が残っている状態を作る。
 */
function documentWithInstance(): DesignDocument {
  return DesignDocument.create({
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
}

test("ドキュメントに残っているノードの複製を挿すと連番の名前が付く", () => {
  const inserted = Result.unwrap(
    DesignDocument.insertNodeCopies(
      setupDocument(),
      { parentName: "screen", index: 1 },
      [{ name: "label", type: "Text" }],
    ),
  );

  expect(inserted.artboards[0].children).toEqual([
    { name: "label", type: "Text" },
    { name: "label-2", type: "Text" },
    { name: "footer", type: "Text" },
  ]);
});

test("指した位置から、渡した順に複製が並ぶ", () => {
  const inserted = Result.unwrap(
    DesignDocument.insertNodeCopies(
      setupDocument(),
      { parentName: "screen", index: 1 },
      [
        { name: "zeta", type: "Text" },
        { name: "alpha", type: "Text" },
      ],
    ),
  );

  expect(inserted.artboards[0].children.map((child) => child.name)).toEqual([
    "label",
    "zeta",
    "alpha",
    "footer",
  ]);
});

test("同じ名前のノードを 2 つ渡しても、複製どうしともドキュメントとも名前が重ならない", () => {
  const inserted = Result.unwrap(
    DesignDocument.insertNodeCopies(
      setupDocument(),
      { parentName: "screen", index: 1 },
      [
        { name: "label", type: "Text" },
        { name: "label", type: "Text" },
      ],
    ),
  );

  expect(DesignDocument.collectErrors(inserted)).toEqual([]);
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

  const inserted = Result.unwrap(
    DesignDocument.insertNodeCopies(
      document,
      { parentName: "screen", index: 1 },
      [
        {
          name: "card",
          type: "Box",
          children: [{ name: "label", type: "Text" }],
        },
      ],
    ),
  );

  expect(inserted.artboards[0].children[1]).toEqual({
    name: "card-2",
    type: "Box",
    children: [{ name: "label-2", type: "Text" }],
  });
});

test("部品インスタンスの複製を挿しても参照先の部品名は変わらない", () => {
  const inserted = Result.unwrap(
    DesignDocument.insertNodeCopies(
      documentWithInstance(),
      { parentName: "screen", index: 1 },
      [{ name: "primary-button-1", ref: "primary-button" }],
    ),
  );

  expect(inserted.artboards[0].children[1]).toEqual({
    name: "primary-button-2",
    ref: "primary-button",
  });
});

test("ロックしたインスタンスの複製を挿すと、複製もロックされている", () => {
  const inserted = Result.unwrap(
    DesignDocument.insertNodeCopies(
      documentWithInstance(),
      { parentName: "screen", index: 1 },
      [{ name: "primary-button-1", ref: "primary-button", locking: "locked" }],
    ),
  );

  expect(DesignDocument.isLocked(inserted, "primary-button-2")).toBe(true);
});

test("ドキュメントに無い名前のノードの複製を挿すとその名前のまま入る", () => {
  const inserted = Result.unwrap(
    DesignDocument.insertNodeCopies(
      setupDocument(),
      { parentName: "screen", index: 1 },
      [{ name: "caption", type: "Text" }],
    ),
  );

  expect(inserted.artboards[0].children[1]).toEqual({
    name: "caption",
    type: "Text",
  });
});

test("子を持てない親へは挿せない", () => {
  expect(
    DesignDocument.insertNodeCopies(
      setupDocument(),
      { parentName: "label", index: 0 },
      [{ name: "zeta", type: "Text" }],
    ),
  ).toEqual(Result.err({ kind: "children-not-allowed", name: "label" }));
});

test("複製を挿しても元のドキュメントは変わらない", () => {
  const document = setupDocument();

  DesignDocument.insertNodeCopies(
    document,
    { parentName: "screen", index: 1 },
    [{ name: "label", type: "Text" }],
  );

  expect(document.artboards[0].children).toEqual([
    { name: "label", type: "Text" },
    { name: "footer", type: "Text" },
  ]);
});

test("空の並びは型で渡せない", () => {
  expectTypeOf<readonly []>().not.toExtend<
    Parameters<typeof DesignDocument.insertNodeCopies>[2]
  >();
});

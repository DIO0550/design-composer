import { expect, expectTypeOf, test } from "vitest";
import { Result } from "@/utils/Result";
import { DesignDocument, DocumentTemplate } from "../index";

/*
 * 複数のノードの複製をツリー上の位置から並べて挿す（docs/06-ui.md「複数選択」のコピー &
 * ペースト）。
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

test("子を持てない親へは挿せない", () => {
  expect(
    DesignDocument.insertNodeCopies(
      setupDocument(),
      { parentName: "label", index: 0 },
      [{ name: "zeta", type: "Text" }],
    ),
  ).toEqual(Result.err({ kind: "children-not-allowed", name: "label" }));
});

test("空の並びは型で渡せない", () => {
  expectTypeOf<readonly []>().not.toExtend<
    Parameters<typeof DesignDocument.insertNodeCopies>[2]
  >();
});

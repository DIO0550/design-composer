import { expect, test } from "vitest";
import { documentWithChildInEachArtboard } from "@/domains/__tests__/sample-document";
import { Option } from "@/utils/Option";
import { DesignDocument } from "../index";

/*
 * 指したノードそれぞれの複製を元の直後へ挿す（docs/06-ui.md「複数選択」の複製）。
 *
 * 複製元には後ろに兄弟がいるものを含める。末尾のノードだけでは「親の末尾へ入れる」実装とも
 * 同じ結果になり、直後へ入ることを確かめられない。
 */

/** `screen` に Text・子を持つ Box・Text が並ぶドキュメント。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          {
            name: "card",
            type: "Box",
            children: [
              { name: "caption", type: "Text" },
              { name: "note", type: "Text" },
            ],
          },
          { name: "footer", type: "Text" },
        ],
      },
    ],
  });
}

/**
 * 複製したあとの artboard 直下の名前の並び。
 *
 * @param names 複製元のノードの名前
 * @returns 複製を挿したあとの `screen` の子の名前
 */
function screenChildNamesAfterCopying(
  names: readonly string[],
): readonly string[] {
  const { document } = Option.unwrap(
    DesignDocument.insertCopiesAfter(setupDocument(), names),
  );
  return document.artboards[0].children.map((child) => child.name);
}

test("兄弟を 2 つ指すと、それぞれの直後に複製が入る", () => {
  expect(screenChildNamesAfterCopying(["title", "card"])).toEqual([
    "title",
    "title-2",
    "card",
    "card-2",
    "footer",
  ]);
});

test("指す順を入れ替えても、複製の並びは同じになる", () => {
  expect(screenChildNamesAfterCopying(["card", "title"])).toEqual([
    "title",
    "title-2",
    "card",
    "card-2",
    "footer",
  ]);
});

test("別の artboard のノードを指すと、それぞれの親の中の直後に複製が入る", () => {
  const { document } = Option.unwrap(
    DesignDocument.insertCopiesAfter(documentWithChildInEachArtboard(), [
      "about-title",
      "home-title",
    ]),
  );

  expect(
    document.artboards.map((artboard) =>
      artboard.children.map((child) => child.name),
    ),
  ).toEqual([
    ["home-title", "home-title-2"],
    ["about-title", "about-title-2"],
  ]);
});

test("祖先と子孫を指すと、祖先だけを複製する", () => {
  const { copyNames } = Option.unwrap(
    DesignDocument.insertCopiesAfter(setupDocument(), ["caption", "card"]),
  );

  expect(copyNames).toEqual(["card-2"]);
});

test("複製の名前は、指した順に並ぶ", () => {
  const { copyNames } = Option.unwrap(
    DesignDocument.insertCopiesAfter(setupDocument(), ["footer", "title"]),
  );

  expect(copyNames).toEqual(["footer-2", "title-2"]);
});

test("同じ名前を 2 回指しても複製は 1 つ", () => {
  const { copyNames } = Option.unwrap(
    DesignDocument.insertCopiesAfter(setupDocument(), ["title", "title"]),
  );

  expect(copyNames).toEqual(["title-2"]);
});

test("artboard が混ざると複製できない", () => {
  expect(
    DesignDocument.insertCopiesAfter(documentWithChildInEachArtboard(), [
      "home",
      "about-title",
    ]),
  ).toEqual(Option.none);
});

test("何も指さなければ複製できない", () => {
  expect(DesignDocument.insertCopiesAfter(setupDocument(), [])).toEqual(
    Option.none,
  );
});

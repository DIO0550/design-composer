import { expect, test } from "vitest";
import { documentWithChildInEachArtboard } from "@/domains/__tests__/sample-document";
import { PropEdit } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";
import { copySourceDocument } from "./copy-setup";

/*
 * 指したノードそれぞれの複製を元の直後へ挿す（docs/06-ui.md「編集操作の一覧」と「複数選択」の
 * 複製）。
 */

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
    DesignDocument.insertCopiesAfter(copySourceDocument(), names),
  );
  return document.artboards[0].children.map((child) => child.name);
}

test("Text を複製すると同じ親の中の直後に連番の名前で入る", () => {
  expect(screenChildNamesAfterCopying(["title"])).toEqual([
    "title",
    "title-2",
    "card",
    "login",
    "footer",
  ]);
});

test("兄弟を 2 つ指すと、それぞれの直後に複製が入る", () => {
  expect(screenChildNamesAfterCopying(["title", "card"])).toEqual([
    "title",
    "title-2",
    "card",
    "card-2",
    "login",
    "footer",
  ]);
});

test("指す順を入れ替えても、複製の並びは同じになる", () => {
  expect(screenChildNamesAfterCopying(["card", "title"])).toEqual([
    "title",
    "title-2",
    "card",
    "card-2",
    "login",
    "footer",
  ]);
});

test("子孫を持つノードを複製すると子孫の名前も付け替わる", () => {
  const { document } = Option.unwrap(
    DesignDocument.insertCopiesAfter(copySourceDocument(), ["card"]),
  );

  expect(document.artboards[0].children[2]).toEqual({
    name: "card-2",
    type: "Box",
    children: [
      { name: "caption-2", type: "Text" },
      { name: "note-2", type: "Text" },
    ],
  });
});

test("入れ子の中のノードを複製するとその親の中の直後に入る", () => {
  const { document } = Option.unwrap(
    DesignDocument.insertCopiesAfter(copySourceDocument(), ["caption"]),
  );

  expect(document.artboards[0].children[1]).toEqual({
    name: "card",
    type: "Box",
    children: [
      { name: "caption", type: "Text" },
      { name: "caption-2", type: "Text" },
      { name: "note", type: "Text" },
    ],
  });
});

test("部品インスタンスを複製しても参照先の部品名は変わらない", () => {
  const { document } = Option.unwrap(
    DesignDocument.insertCopiesAfter(copySourceDocument(), ["login"]),
  );

  expect(document.artboards[0].children[3]).toEqual({
    name: "login-2",
    ref: "primary-button",
  });
});

test("ロックしたインスタンスを複製すると、複製もロックされている", () => {
  const locked = Result.unwrap(
    DesignDocument.applyRefOwnPropEdit(
      copySourceDocument(),
      "login",
      PropEdit.set(["locking"], "locked"),
    ),
  );

  const { document } = Option.unwrap(
    DesignDocument.insertCopiesAfter(locked, ["login"]),
  );

  expect(DesignDocument.isLocked(document, "login-2")).toBe(true);
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

test("祖先と子孫を指すと、祖先だけを複製し、その根の名前が返る", () => {
  const { copyNames } = Option.unwrap(
    DesignDocument.insertCopiesAfter(copySourceDocument(), ["caption", "card"]),
  );

  expect(copyNames).toEqual(["card-2"]);
});

test("複製の名前は、指した順に並ぶ", () => {
  const { copyNames } = Option.unwrap(
    DesignDocument.insertCopiesAfter(copySourceDocument(), ["footer", "title"]),
  );

  expect(copyNames).toEqual(["footer-2", "title-2"]);
});

test("同じ名前を 2 回指しても複製は 1 つ", () => {
  const { copyNames } = Option.unwrap(
    DesignDocument.insertCopiesAfter(copySourceDocument(), ["title", "title"]),
  );

  expect(copyNames).toEqual(["title-2"]);
});

test("artboard の名前を指すと複製できない", () => {
  expect(
    DesignDocument.insertCopiesAfter(copySourceDocument(), ["screen"]),
  ).toEqual(Option.none);
});

test("artboard が混ざると複製できない", () => {
  expect(
    DesignDocument.insertCopiesAfter(documentWithChildInEachArtboard(), [
      "home",
      "about-title",
    ]),
  ).toEqual(Option.none);
});

test("部品定義の中のノードの名前を指すと複製できない", () => {
  expect(
    DesignDocument.insertCopiesAfter(copySourceDocument(), ["button-label"]),
  ).toEqual(Option.none);
});

test("無い名前を指すと複製できない", () => {
  expect(
    DesignDocument.insertCopiesAfter(copySourceDocument(), ["missing"]),
  ).toEqual(Option.none);
});

test("何も指さなければ複製できない", () => {
  expect(DesignDocument.insertCopiesAfter(copySourceDocument(), [])).toEqual(
    Option.none,
  );
});

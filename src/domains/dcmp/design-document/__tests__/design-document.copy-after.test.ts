import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/*
 * ノードの複製を元の直後へ挿す（docs/06-ui.md「編集操作の一覧」の複製）。
 *
 * 複製元には後ろに兄弟がいるものを選ぶ。末尾のノードでは「親の末尾へ入れる」実装とも
 * 同じ結果になり、直後へ入ることを確かめられない。
 */

/**
 * artboard の下に Text・子を持つ Box・部品インスタンスが並び、Box の中にも Text が 2 つ
 * 並ぶドキュメント。部品定義の中にもノードを 1 つ持つ。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: {
      "primary-button": {
        type: "Box",
        children: [{ name: "button-label", type: "Text" }],
      },
    },
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
          { name: "login", ref: "primary-button" },
          { name: "footer", type: "Text" },
        ],
      },
    ],
  });
}

/**
 * 複製したあとの artboard 直下の名前の並び。
 *
 * @param name 複製元のノードの名前
 * @returns 複製を挿したあとの `screen` の子の名前
 */
function screenChildNamesAfterCopying(name: string): readonly string[] {
  const { document } = Result.unwrap(
    DesignDocument.insertCopyAfter(setupDocument(), name),
  );
  return document.artboards[0].children.map((child) => child.name);
}

test("Text を複製すると同じ親の中の直後に連番の名前で入る", () => {
  expect(screenChildNamesAfterCopying("title")).toEqual([
    "title",
    "title-2",
    "card",
    "login",
    "footer",
  ]);
});

test("子孫を持つノードを複製すると子孫の名前も付け替わる", () => {
  const { document } = Result.unwrap(
    DesignDocument.insertCopyAfter(setupDocument(), "card"),
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
  const { document } = Result.unwrap(
    DesignDocument.insertCopyAfter(setupDocument(), "caption"),
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
  const { document } = Result.unwrap(
    DesignDocument.insertCopyAfter(setupDocument(), "login"),
  );

  expect(document.artboards[0].children[3]).toEqual({
    name: "login-2",
    ref: "primary-button",
  });
});

test("複製の根に付いた名前が返る", () => {
  const copied = Result.unwrap(
    DesignDocument.insertCopyAfter(setupDocument(), "card"),
  );

  expect(copied.copyName).toBe("card-2");
});

test("artboard の名前を指すと複製できない", () => {
  expect(DesignDocument.insertCopyAfter(setupDocument(), "screen")).toEqual(
    Result.err({ kind: "node-not-found", name: "screen" }),
  );
});

test("部品定義の中のノードの名前を指すと複製できない", () => {
  expect(
    DesignDocument.insertCopyAfter(setupDocument(), "button-label"),
  ).toEqual(Result.err({ kind: "node-not-found", name: "button-label" }));
});

test("無い名前を指すと複製できない", () => {
  expect(DesignDocument.insertCopyAfter(setupDocument(), "missing")).toEqual(
    Result.err({ kind: "node-not-found", name: "missing" }),
  );
});

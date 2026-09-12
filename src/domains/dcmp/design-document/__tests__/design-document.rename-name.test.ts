import { expect, test } from "vitest";
import { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/*
 * 名前で指した 1 つに別の名前を付ける操作（docs/06-ui.md「編集操作の一覧」の名前を変更）。
 * コピー & ペーストの自動リネームは観点が別なので `design-document.rename.test.ts` が持つ。
 */

/**
 * 部品と、その部品を指すインスタンスを載せた artboard を持つドキュメント。
 *
 * 部品を挟むのは、単一名前空間が部品名・部品内部のノード名まで含むことを確かめるため。
 *
 * @returns `panel` の中に `label` と インスタンス `login` が並ぶドキュメント
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
        name: "home",
        width: 375,
        height: 812,
        children: [
          {
            name: "panel",
            type: "Box",
            children: [
              { name: "label", type: "Text" },
              { name: "login", ref: "primary-button" },
            ],
          },
        ],
      },
    ],
  });
}

test("artboard の名前を変えると、その artboard が新しい名前になる", () => {
  const renamed = Result.unwrap(
    DesignDocument.rename(setupDocument(), { from: "home", to: "top" }),
  );

  expect(DesignDocument.collectArtboardNames(renamed)).toEqual(["top"]);
});

test("ノードの名前を変えると、そのノードだけが新しい名前になり子はそのまま残る", () => {
  const renamed = Result.unwrap(
    DesignDocument.rename(setupDocument(), { from: "panel", to: "card" }),
  );

  const card = Option.unwrap(DesignDocument.findNode(renamed, "card"));
  expect(Node.children(card).map((child) => child.name)).toEqual([
    "label",
    "login",
  ]);
});

test("名前を変えると、元の名前ではもう引けなくなる", () => {
  const renamed = Result.unwrap(
    DesignDocument.rename(setupDocument(), { from: "label", to: "caption" }),
  );

  expect(DesignDocument.findNode(renamed, "label").some).toBe(false);
});

test("同じ artboard にある別のノードの名前へは変えられない", () => {
  const result = DesignDocument.rename(setupDocument(), {
    from: "label",
    to: "login",
  });

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "login" },
  });
});

test("部品名へは変えられない（名前空間はドキュメント全体で 1 つなので）", () => {
  const result = DesignDocument.rename(setupDocument(), {
    from: "label",
    to: "primary-button",
  });

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "primary-button" },
  });
});

test("部品の内部にあるノードの名前へは変えられない", () => {
  const result = DesignDocument.rename(setupDocument(), {
    from: "label",
    to: "button-label",
  });

  expect(result).toEqual({
    ok: false,
    error: { kind: "duplicate-name", name: "button-label" },
  });
});

test("識別子の規則を満たさない名前へは変えられない", () => {
  const result = DesignDocument.rename(setupDocument(), {
    from: "label",
    to: "Caption",
  });

  expect(result).toEqual({
    ok: false,
    error: { kind: "invalid-name", name: "Caption" },
  });
});

test("ドキュメントに無い名前を変えようとすると node-not-found になる", () => {
  const result = DesignDocument.rename(setupDocument(), {
    from: "missing",
    to: "caption",
  });

  expect(result).toEqual({
    ok: false,
    error: { kind: "node-not-found", name: "missing" },
  });
});

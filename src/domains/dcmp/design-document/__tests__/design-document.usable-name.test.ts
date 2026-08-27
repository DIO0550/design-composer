import { expect, test } from "vitest";
import { DesignDocument } from "../index";

/*
 * 名前の可否は部品化のボタンが読む（`create-component`）。`createComponent` を
 * 空撃ちして `ok` を見ていたものを述語へ置き換えた（#246）。
 *
 * 両者は同じ私有ヘルパーを通るので条件はずれない。ずれうるのは `createComponent` が
 * そのヘルパーを参照しなくなったときで、それを 5 番目のテストで留めている
 * （述語が false を返す名前で部品化が通ってしまうと落ちる）。
 */

/** 部品 `card`・artboard `screen`・ノード `box-1` を持つドキュメント。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: { card: { type: "Box" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "box-1", type: "Box" }],
      },
    ],
  });
}

test("使われていない kebab-case の名前は新しく付けられる", () => {
  expect(DesignDocument.isUsableName(setupDocument(), "info-panel")).toBe(true);
});

test("識別子の規則を満たさない名前は新しく付けられない", () => {
  // 名前空間に無い綴りを選ぶ（重複の検査を消しても落ちるようにするため）
  expect(DesignDocument.isUsableName(setupDocument(), "Card")).toBe(false);
});

test("既に使われている名前は新しく付けられない", () => {
  // kebab-case の名前を選ぶ（識別子の規則の検査を消しても落ちるようにするため）
  expect(DesignDocument.isUsableName(setupDocument(), "card")).toBe(false);
});

test("部品の内部にあるノード名も使われている名前として扱う", () => {
  const document = DesignDocument.create({
    components: {
      card: { type: "Box", children: [{ name: "card-title", type: "Text" }] },
    },
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  expect(DesignDocument.isUsableName(document, "card-title")).toBe(false);
});

test("使えないと判定した名前では部品化が失敗する", () => {
  const document = setupDocument();

  expect(DesignDocument.isUsableName(document, "card")).toBe(false);
  expect(DesignDocument.createComponent(document, "box-1", "card").ok).toBe(
    false,
  );
});

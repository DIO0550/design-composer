import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import { DesignDocument } from "@/domains/design-document";
import { InstanceComposition } from "../index";

/*
 * 解除できるかは解除のボタンが読む（`SelectionControls.isDetachEnabled`）。
 * `detach` を空撃ちして `ok` を見ていたものを述語へ置き換えた（#246）。
 *
 * 両者は同じ私有ヘルパーを通るので条件はずれない。ずれうるのは `detach` がそのヘルパーを
 * 参照しなくなったときで、それを 3 番目のテストで留めている（述語が解除できないと
 * 答えたものを解除できてしまうと落ちる）。
 *
 * 「ref ノードでない」「存在しない名前」は `instance-composition.detach-edge.test.ts`
 * が同じ判定を通して固定しているので、ここには重ねない。
 */

const Components: ComponentSet = {
  "primary-button": {
    type: "Box",
    children: [{ name: "button-label", type: "Text" }],
  },
};

/** `primary-button` を 1 つインスタンス化しただけのドキュメント。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: Components,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "save-button", ref: "primary-button" }],
      },
    ],
  });
}

test("参照先の部品が引けるインスタンスは解除できる", () => {
  expect(InstanceComposition.isDetachable(setupDocument(), "save-button")).toBe(
    true,
  );
});

/** 部品 `card` が自分自身を参照しているドキュメント。 */
function setupCircularDocument(): DesignDocument {
  return DesignDocument.create({
    components: {
      card: { type: "Box", children: [{ name: "card-inner", ref: "card" }] },
    },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "summary", ref: "card" }],
      },
    ],
  });
}

test("循環参照になっている部品を指すインスタンスは解除できない", () => {
  expect(
    InstanceComposition.isDetachable(setupCircularDocument(), "summary"),
  ).toBe(false);
});

test("解除できないと判定したインスタンスは解除しようとしても失敗する", () => {
  const document = setupCircularDocument();

  expect(InstanceComposition.isDetachable(document, "summary")).toBe(false);
  expect(InstanceComposition.detach(document, "summary").ok).toBe(false);
});

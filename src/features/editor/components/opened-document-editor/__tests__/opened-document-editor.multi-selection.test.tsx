import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { currentRowNames } from "@/components/__tests__/row-names";
import { Artboard } from "@/domains/artboard";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { highlightedNames } from "@/features/canvas/__tests__/canvas-elements";
import { canvasPane, propertyPane, renderOpenedDocument, tree } from "./setup";

/**
 * 3 ペインを実物のまま組み立て、`Select all N instances` を押した結果が
 * ツリー・キャンバス・右ペインへ届くことを確かめる（docs/06-ui.md「選択」）。
 *
 * ここでしか見られないのは配線そのもの。ドメイン・reducer・単体 UI を個別に揃えても、
 * `useNodeActions` から `PropertyPanel` までのどこかが切れていれば全部緑になる。
 *
 * `SampleDocument` を使わないのは、同じ部品を指すインスタンスが 1 つしか無く、
 * ボタンが押せる状態を作れないため。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      Artboard.create({
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "home-title", type: "Text", props: { content: "ホーム" } },
          {
            name: "home-login",
            ref: "primary-button",
            overrides: { label: "ログイン" },
          },
          {
            name: "home-signup",
            ref: "primary-button",
            overrides: { label: "登録" },
          },
        ],
      }),
    ],
  });
}

test("インスタンスを選んでまとめて選ぶと、ツリーの複数行が選択状態になる", async () => {
  await renderOpenedDocument(setupDocument());
  await userEvent.click(within(canvasPane()).getByText("ログイン"));

  await userEvent.click(
    within(propertyPane()).getByRole("button", {
      name: "Select all 2 instances",
    }),
  );

  expect(currentRowNames(tree())).toEqual(["home-login", "home-signup"]);
});

test("インスタンスを選んでまとめて選ぶと、キャンバスの複数のノードが強調される", async () => {
  await renderOpenedDocument(setupDocument());
  await userEvent.click(within(canvasPane()).getByText("ログイン"));

  await userEvent.click(
    within(propertyPane()).getByRole("button", {
      name: "Select all 2 instances",
    }),
  );

  const highlighted = highlightedNames(canvasPane());

  expect(highlighted).toContain("home-login");
  expect(highlighted).toContain("home-signup");
});

test("まとめて選ぶと右ペインが選択数に切り替わる", async () => {
  await renderOpenedDocument(setupDocument());
  await userEvent.click(within(canvasPane()).getByText("ログイン"));

  await userEvent.click(
    within(propertyPane()).getByRole("button", {
      name: "Select all 2 instances",
    }),
  );

  expect(
    within(propertyPane()).getByRole("heading", { name: "2 selected" }),
  ).toBeDefined();
});

test("まとめて選んだあとにツリーで1つ選び直すと単一選択に戻る", async () => {
  await renderOpenedDocument(setupDocument());
  await userEvent.click(within(canvasPane()).getByText("ログイン"));
  await userEvent.click(
    within(propertyPane()).getByRole("button", {
      name: "Select all 2 instances",
    }),
  );

  await userEvent.click(within(tree()).getByText("home-signup"));

  expect(currentRowNames(tree())).toEqual(["home-signup"]);
});

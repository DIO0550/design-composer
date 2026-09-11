import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { currentRowNames } from "@/components/__tests__/row-names";
import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import {
  canvasSurface,
  drag,
  highlightedNames,
  movePointer,
  pressPointer,
  stubBounds,
} from "@/features/canvas/__tests__";
import {
  canvasPane,
  drawn,
  propertyPane,
  renderOpenedDocument,
  tree,
} from "./setup";

/**
 * 3 ペインを実物のまま組み立て、`Select all N instances` を押した結果が
 * ツリー・キャンバス・右ペインへ届くことを確かめる（docs/06-ui.md「選択」）。
 *
 * ここでしか見られないのは配線そのもの。ドメイン・reducer・単体 UI を個別に揃えても、
 * `useNodeActions` から `PropertyPanel` までのどこかが切れていれば全部緑になる。
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

test("キャンバスの空き領域から範囲を引くと、範囲に入ったノードがまとめて選ばれる", async () => {
  /*
   * ここでしか見られないのは配線そのもの。`EditorState.selectNodes` も
   * `ArtboardCanvas` の通知も個別には緑にできるが、`useNodeActions` から reducer までの
   * どこかが切れていれば範囲を引いても選択が変わらない。
   */
  await renderOpenedDocument(setupDocument());
  stubBounds(drawn("home-title"), {
    left: 140,
    top: 84,
    width: 60,
    height: 20,
  });
  stubBounds(drawn("home-login"), {
    left: 140,
    top: 120,
    width: 80,
    height: 24,
  });
  // 3 つ目（`home-signup`）は範囲の外に置き、選びすぎても落ちるようにする
  stubBounds(drawn("home-signup"), {
    left: 140,
    top: 400,
    width: 80,
    height: 24,
  });

  drag(canvasSurface(), { from: { x: 60, y: 40 }, to: { x: 260, y: 200 } });

  expect(currentRowNames(tree())).toEqual(["home-title", "home-login"]);
});

test("範囲を引いている間、離す前からツリーの選択行が追随する", async () => {
  /*
   * 離してから選ぶ形だと、何が選ばれるのかを引きながら確かめられない（レビュー指摘）。
   * 配線の通しで見るのは、選択そのものを動かしているから（見た目だけの別経路ではない）。
   */
  await renderOpenedDocument(setupDocument());
  stubBounds(drawn("home-title"), {
    left: 140,
    top: 84,
    width: 60,
    height: 20,
  });
  stubBounds(drawn("home-login"), {
    left: 140,
    top: 120,
    width: 80,
    height: 24,
  });

  pressPointer(canvasSurface(), { x: 60, y: 40 });
  movePointer(canvasSurface(), { x: 260, y: 200 });

  expect(currentRowNames(tree())).toEqual(["home-title", "home-login"]);
});

test("範囲を引いてまとめて選ぶと右ペインが選択数に切り替わる", async () => {
  await renderOpenedDocument(setupDocument());
  stubBounds(drawn("home-title"), {
    left: 140,
    top: 84,
    width: 60,
    height: 20,
  });
  stubBounds(drawn("home-login"), {
    left: 140,
    top: 120,
    width: 80,
    height: 24,
  });

  drag(canvasSurface(), { from: { x: 60, y: 40 }, to: { x: 260, y: 200 } });

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

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/features/editor/__tests__/row-names";
import {
  breakFileExternally,
  canvasPane,
  leftPane,
  propertyPane,
  renderOpenedDocument,
  selectArtboard,
  tree,
} from "./setup";

/*
 * アプリ内の編集で作った不正が画面に出ることを、編集画面の配線ごと確かめる（#128）。
 *
 * ドキュメント由来のエラーは状態に持たず表示のたびに導出するので、`EditorState` 単体の
 * テストでは「導出した一覧がどの器に流れるか」（外部変更由来と取り違えていないか、
 * ツールバーを消していないか）を通らない。
 */

/**
 * tokens の一覧から `heading` を消す。
 *
 * `home-title` だけがこのトークンを指しており、`card-title` は `subheading` を
 * 指したままなので、消しても不正になるのは 1 箇所だけになる。
 */
async function removeHeadingToken(): Promise<void> {
  await userEvent.click(
    within(leftPane()).getByRole("button", { name: "Tokens" }),
  );
  // 開いた直後に開いているのは先頭の種別だけなので、typography は自分で開く。
  await userEvent.click(
    within(leftPane()).getByRole("button", { name: /typography/ }),
  );
  // `subheading` に巻き込まれないよう、語の切れ目で区切って指す。
  await userEvent.click(
    within(leftPane()).getByRole("button", { name: /\bheading\b/ }),
  );
  await userEvent.click(
    within(propertyPane()).getByRole("button", { name: "Delete token" }),
  );
}

test("使用中のトークンを消すと、それを参照しているノードが dangling 参照として画面に出る", async () => {
  await renderOpenedDocument();

  await removeHeadingToken();

  const errorList = screen.getByRole("alert", {
    name: "ドキュメントのエラー一覧",
  });
  expect(within(errorList).getByText("home-title.typography")).toBeDefined();
});

test("編集で作った不正は、外部変更で壊れたときの一覧には出ない", async () => {
  await renderOpenedDocument();

  await removeHeadingToken();

  expect(screen.queryByRole("alert", { name: "エラー一覧" })).toBeNull();
});

test("編集で不正を作ったあとにファイルも壊れると、ファイルのエラー一覧が出る", async () => {
  const fake = await renderOpenedDocument();
  await removeHeadingToken();

  await breakFileExternally(fake);

  expect(screen.getByRole("alert", { name: "エラー一覧" })).toBeDefined();
});

test("編集で不正を作ったあとにファイルも壊れると、ドキュメントのエラー一覧は引っ込む", async () => {
  const fake = await renderOpenedDocument();
  await removeHeadingToken();

  await breakFileExternally(fake);

  expect(
    screen.queryByRole("alert", { name: "ドキュメントのエラー一覧" }),
  ).toBeNull();
});

test("編集で作った不正が出ていてもキャンバスは凍らず、ノードを追加できる", async () => {
  await renderOpenedDocument();
  await removeHeadingToken();

  await userEvent.click(
    within(leftPane()).getByRole("button", { name: "Layers" }),
  );
  await selectArtboard("home");
  await userEvent.click(
    within(canvasPane()).getByRole("button", { name: "Box を追加" }),
  );

  expect(rowNames(tree())).toEqual(["home-title", "home-login", "box"]);
});

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { currentRowNames } from "@/components/__tests__/row-names";
import { canvasContent, tokenReferrerNames } from "@/features/canvas/__tests__";
import { LeftPaneViews } from "@/features/sidebar";
import {
  breakFileExternally,
  canvasPane,
  goTo,
  leftPane,
  railButton,
  renderOpenedDocument,
  tree,
} from "./setup";

/**
 * 左ペインを tokens へ切り替え、typography の節を開く。
 *
 * 破線と帯は「トークンが選択されている間」出るので、画面から選ぶところを通さないと
 * 配線が切れていても単体テストは緑のままになる。
 *
 * 開いた直後に開いているのは先頭の種別だけなので、typography は自分で開く。
 * 節の開閉は 1 度だけ行う（2 度押すと畳んで行が消える）。
 */
async function openTypographySection(): Promise<void> {
  await goTo(LeftPaneViews.Tokens);
  await userEvent.click(
    within(leftPane()).getByRole("button", { name: /^typography/ }),
  );
}

/** 開いている節から 1 件選ぶ。`subheading` に巻き込まれないよう語の切れ目で区切る。 */
async function selectToken(name: string): Promise<void> {
  await userEvent.click(
    within(leftPane()).getByRole("button", {
      name: new RegExp(`\\b${name}\\b`),
    }),
  );
}

/** キャンバス下端の帯。 */
function dashedNodes(): HTMLElement {
  return within(canvasPane()).getByRole("region", { name: "キャンバスの破線" });
}

/** 帯のリンクを押す（#209）。 */
async function revealInTree(): Promise<void> {
  await userEvent.click(
    within(dashedNodes()).getByRole("button", { name: "reveal in tree" }),
  );
}

test("トークンを選ぶと、それを参照しているノードがキャンバスで破線になる", async () => {
  await renderOpenedDocument();

  await openTypographySection();
  await selectToken("heading");

  expect(tokenReferrerNames(canvasContent())).toEqual(["home-title"]);
});

test("トークンを選ぶと、キャンバス下端に破線の本数が出る", async () => {
  await renderOpenedDocument();

  await openTypographySection();
  await selectToken("heading");

  expect(
    within(dashedNodes()).getByText("1 node · dashed in canvas"),
  ).toBeDefined();
});

test("トークンを選び直すと、破線が掛かる相手も選び直した先のものになる", async () => {
  await renderOpenedDocument();

  await openTypographySection();
  await selectToken("heading");
  // `subheading` を指すのは card の部品定義の中だけで、キャンバス上には 1 件も無い
  await selectToken("subheading");

  expect(tokenReferrerNames(canvasContent())).toEqual([]);
});

test("部品定義の中からしか参照されていないトークンを選ぶと、キャンバス下端の帯も出ない", async () => {
  await renderOpenedDocument();

  await openTypographySection();
  await selectToken("subheading");

  expect(screen.queryByRole("region", { name: "キャンバスの破線" })).toBeNull();
});

/*
 * 以下 2 本は帯のリンク（#209）。飛び先が「先頭」であることは単体
 * （`token-dashed-nodes.reveal.test.tsx`）が守る。`SampleDocument` の `heading` を
 * 指すのは `home-title` の 1 件だけなので、ここでは先頭の規則を確かめられない。
 */

test("帯の reveal in tree を押すと、破線が掛かっていたノードがツリーで選択状態になる", async () => {
  await renderOpenedDocument();
  await openTypographySection();
  await selectToken("heading");

  await revealInTree();

  // ツリーが引けること自体もここが担保する。次のテストが見るのはレールの印だけ
  expect(currentRowNames(tree())).toEqual(["home-title"]);
});

test("帯の reveal in tree を押すと、左ペインが Layers へ切り替わる", async () => {
  await renderOpenedDocument();
  await openTypographySection();
  await selectToken("heading");

  await revealInTree();

  expect(railButton(LeftPaneViews.Layers).getAttribute("aria-current")).toBe(
    "true",
  );
});

test("ファイルが不正な間も、選んだトークンの破線と帯が出る", async () => {
  const ipc = await renderOpenedDocument();
  await breakFileExternally(ipc);

  await openTypographySection();
  await selectToken("heading");

  // 映っているのは最後に正常だった表示なので、破線の相手もそこに残っている
  expect(
    within(dashedNodes()).getByText("1 node · dashed in canvas"),
  ).toBeDefined();
});

test("ファイルが不正な間も、帯の reveal in tree からそのノードへ飛べる", async () => {
  /*
   * 下端は不正・編集可の 2 枝に分かれており、帯とリンクは両方に出る。
   * 編集可の枝だけを見ると、不正の枝で `onReveal` を渡し忘れても緑のままになる。
   */
  const ipc = await renderOpenedDocument();
  await breakFileExternally(ipc);
  await openTypographySection();
  await selectToken("heading");

  await revealInTree();

  expect(currentRowNames(tree())).toEqual(["home-title"]);
});

import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  canvasContent,
  tokenReferrerNames,
} from "@/features/editor/__tests__/canvas-elements";
import { canvasPane, leftPane, renderOpenedDocument } from "./setup";

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
  await userEvent.click(
    within(leftPane()).getByRole("button", { name: "Tokens" }),
  );
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
function legend(): HTMLElement {
  return within(canvasPane()).getByRole("region", { name: "キャンバスの破線" });
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

  expect(within(legend()).getByText("1 node · dashed in canvas")).toBeDefined();
});

test("トークンを選び直すと、破線が掛かる相手も選び直した先のものになる", async () => {
  await renderOpenedDocument();

  await openTypographySection();
  await selectToken("heading");
  await selectToken("body");

  // `body` を指すのは部品定義の中だけで、キャンバス上には 1 件も無い
  expect(tokenReferrerNames(canvasContent())).toEqual([]);
});

test("破線が1本も無いトークンを選ぶと、キャンバス下端の帯も出ない", async () => {
  await renderOpenedDocument();

  await openTypographySection();
  await selectToken("body");

  expect(screen.queryByRole("region", { name: "キャンバスの破線" })).toBeNull();
});

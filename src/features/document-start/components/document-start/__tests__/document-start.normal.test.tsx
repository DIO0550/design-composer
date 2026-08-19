import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DocumentStart } from "../index";

/** エラーの一覧を出さない状態だけを見るので、渡す描き方は空でよい。 */
function renderNothing() {
  return null;
}

test("開始画面は、支援技術から名前で辿れる", () => {
  render(
    <DocumentStart session={{ kind: "closed" }} renderErrors={renderNothing} />,
  );

  expect(
    screen.getByRole("region", { name: "ドキュメントの開始" }),
  ).toBeDefined();
});

test("何も開いていない間は、開くか作るよう案内される", () => {
  render(
    <DocumentStart session={{ kind: "closed" }} renderErrors={renderNothing} />,
  );

  expect(
    screen.getByText("ドキュメントを開くか、新しく作成してください。"),
  ).toBeDefined();
});

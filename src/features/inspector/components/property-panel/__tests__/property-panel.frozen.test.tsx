import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { renderFrozenPanel, renderPanel } from "./setup";

/**
 * 外部編集でファイルが壊れている間の本文（#135）。映っているのは最後に正常だった
 * 表示なので、そこへ編集を加えさせない。何を選んでいたかは帯に残す。
 */
function selectedTitle(): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "home-title", type: "Text", props: { content: "ホーム" } },
          ],
        },
      ],
    }),
    ["home-title"],
  );
}

test("凍結中は選んでいても編集欄を出さず、凍結中であることを出す", () => {
  renderFrozenPanel(selectedTitle());

  expect(screen.getByText("選択は凍結中")).toBeDefined();
  expect(screen.queryByRole("textbox", { name: "Content" })).toBeNull();
});

test("凍結していなければ同じ選択で編集欄が出る", () => {
  // 上の対照。凍結の分岐を丸ごと消しても、これが無いと上の 1 件だけでは落ちない
  renderPanel(selectedTitle());

  expect(screen.getByRole("textbox", { name: "Content" })).toBeDefined();
});

test("凍結中でも何を選んでいたかは見出しに残る", () => {
  renderFrozenPanel(selectedTitle());

  expect(screen.getByRole("heading", { name: "home-title" })).toBeDefined();
});

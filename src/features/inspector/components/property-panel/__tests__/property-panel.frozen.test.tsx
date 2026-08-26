import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { renderFrozenPanel, renderPanel } from "./setup";

/**
 * 外部編集でファイルが壊れている間の本文（#135）。映っているのは最後に正常だった
 * 表示なので、そこへ編集を加えさせない。
 *
 * 見出しが選んでいたものを保つことはここでは見ない。帯の中身（`PropertyPanel.Title`）は
 * `isFrozen` を受け取らないので、この単位ではその主張を破る実装を書けない。
 * 見ているのは器を着せる側（`opened-document-editor.frozen.test.tsx`）。
 *
 * @returns Text ノードを 1 つ選んだ状態の選択
 */
function frozenSelection(): DocumentSelection {
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
  renderFrozenPanel(frozenSelection());

  expect(screen.getByText("選択は凍結中")).toBeDefined();
  expect(screen.queryByRole("textbox", { name: "Content" })).toBeNull();
});

test("凍結していなければ同じ選択で編集欄が出る", () => {
  // 上の対照。凍結の分岐を丸ごと消しても、これが無いと上の 1 件だけでは落ちない
  renderPanel(frozenSelection());

  expect(screen.getByRole("textbox", { name: "Content" })).toBeDefined();
});

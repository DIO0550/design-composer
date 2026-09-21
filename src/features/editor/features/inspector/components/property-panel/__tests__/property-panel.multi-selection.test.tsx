import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { renderPanel } from "./setup";

/**
 * 複数選んでいるときの右ペインの本文（docs/06-ui.md「選択」）。
 * 編集欄を出さず、選択の解除だけを残す。
 *
 * 帯に何が出るか（件数 / 1 つの名前は出ない）は
 * `property-panel.heading.test.tsx` が見る。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "home-login", ref: "primary-button" },
          { name: "home-signup", ref: "primary-button" },
        ],
      },
    ],
  });
}

/** 同じ部品を指す 2 つのインスタンスを選んだ状態。 */
function renderMultiSelected() {
  renderPanel(
    DocumentSelection.fromNames(setupDocument(), ["home-login", "home-signup"]),
  );
}

test("複数選んでいると公開 prop の節が出ない", () => {
  renderMultiSelected();

  expect(screen.queryByRole("heading", { name: "Public props" })).toBeNull();
});

test("1つだけ選んでいるときは公開 prop の節が出る", () => {
  // 上の対照。同じドキュメントで、単一選択なら節が引けることを見る
  renderPanel(DocumentSelection.fromNames(setupDocument(), ["home-login"]));

  expect(screen.getByRole("heading", { name: "Public props" })).toBeDefined();
});

test("複数選んでいるとインスタンスの操作が出ない", () => {
  renderMultiSelected();

  expect(screen.queryByRole("button", { name: "Detach instance" })).toBeNull();
});

test("複数選んでいても選択を解除できる", () => {
  renderMultiSelected();

  expect(screen.getByRole("button", { name: "選択を解除" })).toBeDefined();
});

test("複数選んでいると、編集できる prop が無いときの案内も出ない", () => {
  /*
   * 「複数選んでいる」を空のセクションで表すと、1 つ選んで編集できる prop が
   * 無いときと同じ見え方になる。区別が付いていることをこの 1 件が守る。
   */
  renderMultiSelected();

  expect(screen.queryByText("編集できる prop がありません")).toBeNull();
});

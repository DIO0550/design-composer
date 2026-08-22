import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { renderTitle } from "./setup";

/**
 * 見出しの帯が「何を選んでいるか」を伝えることを見る
 * （UI 案 docs/Design Composer.html のインスペクタの 44px の帯 / #112）。
 *
 * `mystery` はスキーマに無い `type` のノード。不正なドキュメントでも描画は残るので
 * （docs/03-schema.md「不正ファイル時の挙動」）、選択されることがある。
 * `home-signup` は `home-login` と同じ部品を指すインスタンスで、複数選択を作るために置く。
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
          { name: "home-title", type: "Text" },
          { name: "home-body", type: "Box" },
          { name: "home-login", ref: "primary-button" },
          { name: "home-signup", ref: "primary-button" },
          { name: "mystery", type: "Widget" },
        ],
      },
    ],
  });
}

/** それらの名前を選んだ状態の帯を描く。 */
function renderSelected(...names: readonly string[]) {
  renderTitle(DocumentSelection.fromNames(setupDocument(), names));
}

test("選んでいるものの名前が見出しに出る", () => {
  renderSelected("home-body");

  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(
    "home-body",
  );
});

test("Box を選ぶと種別として Box が出る", () => {
  renderSelected("home-body");

  expect(screen.getByText("Box")).toBeDefined();
});

test("Text を選ぶと種別として Text が出る", () => {
  renderSelected("home-title");

  expect(screen.getByText("Text")).toBeDefined();
});

test("部品インスタンスを選ぶと種別として Instance が出る", () => {
  renderSelected("home-login");

  expect(screen.getByText("Instance")).toBeDefined();
});

test("artboard を選ぶと種別として Artboard が出る", () => {
  renderSelected("home");

  expect(screen.getByText("Artboard")).toBeDefined();
});

test("スキーマに無い type のノードを選んでも名前は見出しに出る", () => {
  renderSelected("mystery");

  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("mystery");
});

test("スキーマに無い type のノードを選ぶと種別は出ない", () => {
  renderSelected("mystery");

  /*
   * 分からない種別を既定へ寄せないことを見る。`Box` へ寄せる実装にすると、
   * ここに `Box` が出て落ちる。
   */
  expect(screen.queryByText("Box")).toBeNull();
});

test("部品インスタンスを選ぶと部品を表す型アイコンが出る", () => {
  renderSelected("home-login");

  expect(screen.getByText("◆")).toBeDefined();
});

test("何も選んでいないときは見出しが1つも出ない", () => {
  renderSelected();

  /*
   * 名前の枠だけを残す実装（中身の空な見出し）にするとここが落ちる。帯そのものを
   * 残すのは呼び出し側の担当で、`opened-document-editor.selection.test.tsx` が見ている。
   */
  expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
});

test("複数選んでいると見出しに選択数が出る", () => {
  renderSelected("home-login", "home-signup");

  expect(screen.getByRole("heading", { name: "2 selected" })).toBeDefined();
});

test("複数選んでいると見出しに1つの名前は出ない", () => {
  renderSelected("home-login", "home-signup");

  expect(screen.queryByRole("heading", { name: "home-login" })).toBeNull();
});

test("1つだけ選んでいるときは見出しにその名前が出る", () => {
  // 「件数を出す」側の対照。これが無いと、帯を丸ごと消しても上の 2 件は通る
  renderSelected("home-login");

  expect(screen.getByRole("heading", { name: "home-login" })).toBeDefined();
});

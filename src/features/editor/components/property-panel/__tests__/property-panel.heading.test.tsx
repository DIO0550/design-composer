import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { PropertyPanel } from "../index";

/**
 * 見出しの帯が「何を選んでいるか」を伝えることを見る
 * （UI 案 docs/Design Composer.html のインスペクタの 44px の帯 / #112）。
 *
 * `mystery` はスキーマに無い `type` のノード。不正なドキュメントでも描画は残るので
 * （docs/03-schema.md「不正ファイル時の挙動」）、選択されることがある。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.DEFAULT.tokens,
      components: DocumentTemplate.DEFAULT.components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "home-title", type: "Text" },
            { name: "home-body", type: "Box" },
            { name: "home-action", ref: "primary-button" },
            { name: "mystery", type: "Widget" },
          ],
        },
      ],
    }),
  );
}

function renderPanel(state: EditorState) {
  render(
    <PropertyPanel
      state={state}
      onEditProp={vi.fn()}
      onClearSelection={vi.fn()}
    />,
  );
}

/** 帯に出ている名前。見出しは帯にしかないので階層で指せる。 */
function headingName(): string {
  return screen.getByRole("heading", { level: 2 }).textContent ?? "";
}

test("選んでいるものの名前が見出しに出る", () => {
  renderPanel(EditorState.select(setupState(), "home-body"));

  expect(headingName()).toBe("home-body");
});

test("Box を選ぶと種別として Box が出る", () => {
  renderPanel(EditorState.select(setupState(), "home-body"));

  expect(screen.getByText("Box")).toBeDefined();
});

test("Text を選ぶと種別として Text が出る", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(screen.getByText("Text")).toBeDefined();
});

test("部品インスタンスを選ぶと種別として Instance が出る", () => {
  renderPanel(EditorState.select(setupState(), "home-action"));

  expect(screen.getByText("Instance")).toBeDefined();
});

test("artboard を選ぶと種別として Artboard が出る", () => {
  renderPanel(EditorState.select(setupState(), "home"));

  expect(screen.getByText("Artboard")).toBeDefined();
});

test("スキーマに無い type のノードを選んでも名前は見出しに出る", () => {
  renderPanel(EditorState.select(setupState(), "mystery"));

  expect(headingName()).toBe("mystery");
});

test("スキーマに無い type のノードを選ぶと種別は出ない", () => {
  renderPanel(EditorState.select(setupState(), "mystery"));

  /*
   * 分からない種別を既定へ寄せないことを見る。`Box` へ寄せる実装にすると、
   * ここに `Box` が出て落ちる（ドキュメントには Box のノードが別にあるので、
   * 綴り自体は実装しだいで出うる）。
   */
  expect(screen.queryByText("Box")).toBeNull();
});

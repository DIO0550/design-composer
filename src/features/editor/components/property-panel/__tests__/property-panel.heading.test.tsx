import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import {
  headingOfName,
  rightPaneHeading,
} from "@/features/editor/__tests__/inspector-heading";
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
      instance={{ goToSource: vi.fn(), detach: vi.fn() }}
      state={state}
      onEditProp={vi.fn()}
      onClearSelection={vi.fn()}
    />,
  );
}

test("選んでいるものの名前が見出しに出る", () => {
  renderPanel(EditorState.select(setupState(), "home-body"));

  expect(headingOfName().textContent).toBe("home-body");
});

test("Box を選ぶと種別として Box が出る", () => {
  renderPanel(EditorState.select(setupState(), "home-body"));

  expect(within(rightPaneHeading()).getByText("Box")).toBeDefined();
});

test("Text を選ぶと種別として Text が出る", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(within(rightPaneHeading()).getByText("Text")).toBeDefined();
});

test("部品インスタンスを選ぶと種別として Instance が出る", () => {
  renderPanel(EditorState.select(setupState(), "home-action"));

  /*
   * 帯の中だけを見る。`Instance` は本文のインスタンス操作の節の見出しにも出るので
   * （UI 案 docs/Design Composer.html はどちらにもこの綴りを置いている）、
   * 画面全体から引くと 2 つ見つかる。
   */
  expect(within(rightPaneHeading()).getByText("Instance")).toBeDefined();
});

test("artboard を選ぶと種別として Artboard が出る", () => {
  renderPanel(EditorState.select(setupState(), "home"));

  expect(within(rightPaneHeading()).getByText("Artboard")).toBeDefined();
});

test("スキーマに無い type のノードを選んでも名前は見出しに出る", () => {
  renderPanel(EditorState.select(setupState(), "mystery"));

  expect(headingOfName().textContent).toBe("mystery");
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

test("何も選んでいなくても見出しの帯は残る", () => {
  renderPanel(setupState());

  /*
   * 帯ごと消す実装にすると落ちる。中身が空でも帯を残すのがこの単位の判断で、
   * 消すと選択のたびに本文の位置が帯のぶん動く。
   */
  expect(rightPaneHeading()).toBeDefined();
});

test("部品インスタンスを選ぶと部品を表す型アイコンが出る", () => {
  renderPanel(EditorState.select(setupState(), "home-action"));

  // 出どころのバッジにも同じアイコンが出るため、帯の中だけを見る
  expect(within(rightPaneHeading()).getByText("◆")).toBeDefined();
});

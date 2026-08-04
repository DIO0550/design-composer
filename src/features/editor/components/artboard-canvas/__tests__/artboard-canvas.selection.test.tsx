import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { ELEMENT_NAME_ATTRIBUTE } from "@/domains/compiled-element";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import {
  highlightedNames,
  renderedElement,
} from "@/features/editor/__tests__/canvas-elements";
import { EditorState } from "@/features/editor/domains/editor-state";
import { ArtboardCanvas } from "../index";

/** artboard の並びだけを差し替えたエディタ状態（トークンと部品は雛形をそのまま使う）。 */
function setupState(
  artboards: Parameters<typeof DesignDocument.create>[0]["artboards"],
): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.DEFAULT.tokens,
      components: DocumentTemplate.DEFAULT.components,
      artboards,
    }),
  );
}

/** キャンバスの中身が載る領域（強調の規則も描かれた要素もこの中に出る）。 */
function canvasContent(): HTMLElement {
  return screen.getByTestId("canvas-content");
}

function setupHomeArtboard(): EditorState {
  return setupState([
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        { name: "home-title", type: "Text", props: { content: "ホーム" } },
        {
          name: "home-login",
          ref: "primary-button",
          overrides: { label: "ログイン" },
        },
      ],
    },
  ]);
}

test("artboard の中のノードを押すと、そのノードを内側とする候補が通知される", async () => {
  const onSelect = vi.fn();
  render(
    <ArtboardCanvas
      state={setupHomeArtboard()}
      onSelect={onSelect}
      onMoveNode={vi.fn()}
    />,
  );

  await userEvent.click(renderedElement(canvasContent(), "home-title"));

  expect(onSelect).toHaveBeenCalledWith(["home-title", "home"]);
});

test("部品インスタンスの中身を押すと、内側の部品定義のノードより外にインスタンスが並ぶ", async () => {
  const onSelect = vi.fn();
  render(
    <ArtboardCanvas
      state={setupHomeArtboard()}
      onSelect={onSelect}
      onMoveNode={vi.fn()}
    />,
  );

  await userEvent.click(screen.getByText("ログイン"));

  expect(onSelect).toHaveBeenCalledWith([
    "primary-button-label",
    "home-login",
    "home",
  ]);
});

test("artboard の枠を押すとその artboard だけが候補になる", async () => {
  const onSelect = vi.fn();
  const state = setupState([
    { name: "home", width: 360, height: 240, children: [] },
    { name: "settings", width: 360, height: 240, children: [] },
  ]);
  render(
    <ArtboardCanvas state={state} onSelect={onSelect} onMoveNode={vi.fn()} />,
  );

  await userEvent.click(screen.getByRole("button", { name: "settings" }));

  expect(onSelect).toHaveBeenCalledWith(["settings"]);
});

test("キーボードで artboard を活性化するとその artboard だけが候補になる", async () => {
  const onSelect = vi.fn();
  const state = setupState([
    { name: "home", width: 360, height: 240, children: [] },
  ]);
  render(
    <ArtboardCanvas state={state} onSelect={onSelect} onMoveNode={vi.fn()} />,
  );

  screen.getByRole("button", { name: "home" }).focus();
  await userEvent.keyboard("{Enter}");

  expect(onSelect).toHaveBeenCalledWith(["home"]);
});

test("選択中のノードはキャンバス上で強調される", () => {
  const state = EditorState.select(setupHomeArtboard(), "home-title");

  render(
    <ArtboardCanvas state={state} onSelect={vi.fn()} onMoveNode={vi.fn()} />,
  );

  expect(highlightedNames(canvasContent())).toEqual(["home-title"]);
});

test("選択中の artboard はキャンバス上で強調される", () => {
  const state = EditorState.select(setupHomeArtboard(), "home");

  render(
    <ArtboardCanvas state={state} onSelect={vi.fn()} onMoveNode={vi.fn()} />,
  );

  expect(highlightedNames(canvasContent())).toEqual(["home"]);
});

test("何も選択していなければ強調されるものは無い", () => {
  render(
    <ArtboardCanvas
      state={setupHomeArtboard()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
    />,
  );

  expect(highlightedNames(canvasContent())).toEqual([]);
});

/**
 * 名前が識別子の規則（kebab-case）に反するドキュメントも、
 * 検証エラーを出したまま画面に残りうる（docs/03「不正ファイル時の挙動」）。
 * その名前を選んでも、強調は選択子の中に収まった 1 本の規則のままでなければならない。
 */
test("名前に二重引用符が含まれていても選択子の中に収まる", () => {
  const quotedName = 'home"]{display:none}[x';
  const state = EditorState.select(
    setupState([{ name: quotedName, width: 360, height: 240, children: [] }]),
    quotedName,
  );

  render(
    <ArtboardCanvas state={state} onSelect={vi.fn()} onMoveNode={vi.fn()} />,
  );

  const styleText = canvasContent().querySelector("style")?.textContent ?? "";
  expect(styleText).toContain(
    `[${ELEMENT_NAME_ATTRIBUTE}="home\\"]{display:none}[x"]`,
  );
});

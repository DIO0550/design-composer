import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { PropertyPanel } from "../index";

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
          props: { background: "white" },
          children: [
            { name: "home-title", type: "Text", props: { content: "ホーム" } },
            { name: "home-action", ref: "primary-button" },
            { name: "home-body", type: "Box", props: { widthMode: "fixed" } },
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

function optionValuesOf(select: HTMLElement): readonly string[] {
  return [...select.querySelectorAll("option")].map((option) => option.value);
}

test("何も選択していないときは選択されていないことを伝える", () => {
  renderPanel(setupState());

  expect(screen.getByText("選択されていません")).toBeDefined();
});

test("enum の prop は宣言された値から選ぶ入力欄になる", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(
    optionValuesOf(screen.getByRole("combobox", { name: "Align" })),
  ).toEqual(["", "left", "center", "right"]);
});

test("トークン参照の prop はトークン名から選ぶ入力欄になる", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(
    optionValuesOf(screen.getByRole("combobox", { name: "Color" })),
  ).toContain("primary");
});

test("文字列の生リテラルの prop は文字入力欄になり、設定されている値が出る", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(screen.getByRole("textbox", { name: "Content" })).toHaveProperty(
    "value",
    "ホーム",
  );
});

test("数値の生リテラルの prop は数値入力欄になる", () => {
  renderPanel(EditorState.select(setupState(), "home-body"));

  expect(screen.getByRole("spinbutton", { name: "Width" })).toBeDefined();
});

test("既定を持たない未指定の prop は未指定とだけ出る", () => {
  renderPanel(EditorState.select(setupState(), "home-body"));

  expect(screen.getByRole("spinbutton", { name: "Width" })).toHaveProperty(
    "placeholder",
    "未指定",
  );
});

test("未指定の prop は既定値付きの未指定が選ばれ、明示設定と区別できる", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(
    screen.getByRole("option", { name: "未指定（既定: left）" }),
  ).toHaveProperty("selected", true);
});

test("prop 名は camelCase の切れ目で語に分けた表示名になる", () => {
  renderPanel(EditorState.select(setupState(), "home"));

  expect(screen.getByRole("combobox", { name: "Padding X" })).toBeDefined();
});

test("group ごとのセクションが見出しとして出る", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(screen.getByRole("heading", { name: "Content" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "Appearance" })).toBeDefined();
});

test("インスタンスを選ぶと部品が公開している prop の入力欄が出る", () => {
  renderPanel(EditorState.select(setupState(), "home-action"));

  expect(screen.getByRole("textbox", { name: "Label" })).toBeDefined();
});

test("artboard を選ぶと Box の prop が編集できる", () => {
  renderPanel(EditorState.select(setupState(), "home"));

  expect(screen.getByRole("combobox", { name: "Background" })).toBeDefined();
});

test("artboard のサイズは props で変えられないので入力欄が出ない", () => {
  renderPanel(EditorState.select(setupState(), "home"));

  expect(screen.queryByRole("combobox", { name: "Width Mode" })).toBeNull();
});

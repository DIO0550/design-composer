import { render, screen, within } from "@testing-library/react";
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
            /* ファイル由来の不正な値。スキーマの `direction` に `diagonal` は無い。 */
            {
              name: "home-odd",
              type: "Box",
              props: { direction: "diagonal" },
            },
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

function optionValuesOf(select: HTMLElement): readonly string[] {
  return [...select.querySelectorAll("option")].map((option) => option.value);
}

/**
 * その入力欄に添えられている色の見本。
 *
 * @param select 見本を探す起点になる入力欄
 * @returns 同じ行に置かれた見本。無ければ `null`
 */
function swatchNextTo(select: HTMLElement): HTMLElement | null {
  return (
    select.parentElement?.querySelector<HTMLElement>(
      "[style*='background-color']",
    ) ?? null
  );
}

test("何も選択していないときは選択されていないことを伝える", () => {
  renderPanel(setupState());

  expect(screen.getByText("選択されていません")).toBeDefined();
});

test("enum の prop は宣言された値ごとのセグメントになる", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  const align = screen.getByRole("group", { name: "Align" });
  expect(
    within(align)
      .getAllByRole("button")
      .map((segment) => segment.textContent),
  ).toEqual(["left", "center", "right"]);
});

test("宣言に無い値が設定されている enum はその値もセグメントとして出る", () => {
  renderPanel(EditorState.select(setupState(), "home-odd"));

  const direction = screen.getByRole("group", { name: "Direction" });
  expect(
    within(direction).getByRole("button", { pressed: true }).textContent,
  ).toBe("diagonal");
});

test("未指定の enum はどのセグメントも選ばれた状態にならない", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  const align = screen.getByRole("group", { name: "Align" });
  expect(within(align).queryAllByRole("button", { pressed: true }).length).toBe(
    0,
  );
});

test("未指定の enum には何が効いているかが行に出る", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(screen.getByText("未指定（既定: left）")).toBeDefined();
});

test("トークン参照の prop はトークン名から選ぶ入力欄になる", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(
    optionValuesOf(screen.getByRole("combobox", { name: "Color" })),
  ).toContain("primary");
});

test("未指定のトークン参照は既定値付きの未指定が選ばれ、明示設定と区別できる", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(
    screen.getByRole("option", { name: "未指定（既定: body）" }),
  ).toHaveProperty("selected", true);
});

test("色のトークン参照には今効いている色の見本が出る", () => {
  renderPanel(EditorState.select(setupState(), "home"));

  const swatch = swatchNextTo(
    screen.getByRole("combobox", { name: "Background" }),
  );
  expect(swatch?.style.backgroundColor).toBe(
    DocumentTemplate.DEFAULT.tokens.colors.white,
  );
});

test("色以外のトークン参照には色の見本が出ない", () => {
  renderPanel(EditorState.select(setupState(), "home"));

  expect(
    swatchNextTo(screen.getByRole("combobox", { name: "Gap" })),
  ).toBeNull();
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

  expect(screen.queryByRole("group", { name: "Width Mode" })).toBeNull();
});

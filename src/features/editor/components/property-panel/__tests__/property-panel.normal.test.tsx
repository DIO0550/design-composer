import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { COLOR_SWATCH_TEST_ID } from "@/components/color-swatch";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { TokenSet } from "@/domains/token";
import { pressedSegmentsOf } from "@/features/editor/__tests__/segmented-controls";
import { EditorState } from "@/features/editor/domains/editor-state";
import { PropertyPanel } from "../index";

/*
 * 色のトークンに `md` を足してある。`gap`（spacing）にも `md` があるので、
 * 「色のトークン参照だけ見本を出す」を壊して spacing まで色として引くと、
 * `Gap` の行に見本が出て落ちる（同名が無いと、壊しても引けずに通ってしまう）。
 */
const TOKENS: TokenSet = {
  ...DocumentTemplate.DEFAULT.tokens,
  colors: { ...DocumentTemplate.DEFAULT.tokens.colors, md: "#123456" },
};

function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: TOKENS,
      components: DocumentTemplate.DEFAULT.components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          props: { background: "white", gap: "md" },
          children: [
            { name: "home-title", type: "Text", props: { content: "ホーム" } },
            { name: "home-action", ref: "primary-button" },
            { name: "home-body", type: "Box", props: { widthMode: "fixed" } },
            /* ファイル由来の不正な値。スキーマの `direction` に `diagonal` は無い。 */
            {
              name: "home-odd",
              type: "Box",
              props: {
                direction: "diagonal",
                background: "missing",
                /* 解決値が出ない側（dangling）と、同じ画面に出る側の対照。 */
                gap: "nope",
                paddingX: "sm",
                shadow: "sm",
              },
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
      `[data-testid="${COLOR_SWATCH_TEST_ID}"]`,
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

  expect(pressedSegmentsOf("Direction")).toEqual(["diagonal"]);
});

test("未指定の enum はどのセグメントも選ばれた状態にならない", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(pressedSegmentsOf("Align")).toEqual([]);
});

test("未指定の enum には何が効いているかが行に出る", () => {
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(screen.getByText("未指定（既定: left）")).toBeDefined();
});

test("値が入っている enum には未指定の注記が出ない", () => {
  /*
   * `home-odd` の `direction` は `diagonal`（既定 `column` を持つので注記の綴り自体は作れる）。
   * 未指定のときだけ出す、という出し分けを外すとここに注記が出て落ちる。
   */
  renderPanel(EditorState.select(setupState(), "home-odd"));

  expect(screen.queryByText("未指定（既定: column）")).toBeNull();
});

test("未指定のトークン参照は行の下ではなく選択肢の側に未指定を出す", () => {
  /*
   * 「セグメントのときだけ行の下に出す」を外すと、`<select>` の行にも同じ綴りの
   * 注記が並んで 2 件になり落ちる。
   */
  renderPanel(EditorState.select(setupState(), "home-title"));

  expect(
    screen
      .getAllByText("未指定（既定: body）")
      .map((element) => element.tagName),
  ).toEqual(["OPTION"]);
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
  expect(swatch?.style.backgroundColor).toBe(TOKENS.colors.white);
});

test("数値のトークン参照には解決後の値が欄の説明として添えて出る", () => {
  renderPanel(EditorState.select(setupState(), "home"));

  expect(
    screen.getByRole("combobox", { name: "Gap", description: "16" }),
  ).toBeDefined();
});

test("実在しないトークンを指す数値の prop には解決値が出ない", () => {
  /*
   * 同じ画面の `Padding X` が対照（`sm` → 8）。何も出ない入力で確かめると、
   * 併記を丸ごと消しても通ってしまう。
   */
  renderPanel(EditorState.select(setupState(), "home-odd"));

  expect(
    screen.getByRole("combobox", { name: "Padding X", description: "8" }),
  ).toBeDefined();
  expect(
    screen
      .getByRole("combobox", { name: "Gap" })
      .getAttribute("aria-describedby"),
  ).toBeNull();
});

test("数値にならないトークン参照には解決値が出ない", () => {
  /*
   * 雛形は `spacing.sm` と `shadows.sm` が同名。種別を無視して引く実装にすると
   * `Shadow` にも spacing の 8 が出て落ちる。
   */
  renderPanel(EditorState.select(setupState(), "home-odd"));

  expect(
    screen.queryByRole("combobox", { name: "Shadow", description: "8" }),
  ).toBeNull();
});

test("色以外のトークン参照には色の見本が出ない", () => {
  renderPanel(EditorState.select(setupState(), "home"));

  expect(
    swatchNextTo(screen.getByRole("combobox", { name: "Gap" })),
  ).toBeNull();
});

test("実在しないトークンを指す色の prop には見本が出ない", () => {
  renderPanel(EditorState.select(setupState(), "home-odd"));

  expect(
    swatchNextTo(screen.getByRole("combobox", { name: "Background" })),
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

import { screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { pressedSegmentsOf } from "@/components/__tests__/segmented-controls";
import {
  ColorSwatchTestId,
  GradientSwatchTestId,
} from "@/components/color-swatch";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { GradientToken, type TokenSet } from "@/domains/dcmp/token";
import { DocumentSelection } from "@/domains/session/document-selection";
import { renderPanel } from "./setup";

/*
 * 色のトークンに `md` を足してある。`gap`（spacing）にも `md` があるので、
 * 「色のトークン参照だけ見本を出す」を壊して spacing まで色として引くと、
 * `Gap` の行に見本が出て落ちる（同名が無いと、壊しても引けずに通ってしまう）。
 */
const Tokens: TokenSet = {
  ...DocumentTemplate.Default.tokens,
  colors: { ...DocumentTemplate.Default.tokens.colors, md: "#123456" },
};

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: Tokens,
    components: DocumentTemplate.Default.components,
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
          { name: "home-banner", type: "Box", props: { background: "brand" } },
          /* ファイル由来の不正な値。スキーマの `layout` に `diagonal` は無い。 */
          {
            name: "home-odd",
            type: "Box",
            props: {
              layout: "diagonal",
              background: "missing",
              /* 解決値が出ない側（dangling）と、同じ画面に出る側の対照。 */
              gap: "nope",
              paddingRight: "sm",
              paddingLeft: "sm",
              shadow: "sm",
            },
          },
        ],
      },
    ],
  });
}

/** その名前を選んだ状態のパネルを描く。名前を渡さなければ未選択。 */
function renderSelected(...names: readonly string[]) {
  renderPanel(DocumentSelection.fromNames(setupDocument(), names));
}

function optionValuesOf(select: HTMLElement): readonly string[] {
  return [...select.querySelectorAll("option")].map((option) => option.value);
}

/**
 * その入力欄に添えられている見本。
 *
 * @param select 見本を探す起点になる入力欄
 * @param testId 探す見本の目印。省略すると色の見本
 * @returns 同じ行に置かれた見本。無ければ `null`
 */
function swatchNextTo(
  select: HTMLElement,
  testId: string = ColorSwatchTestId,
): HTMLElement | null {
  return (
    select.parentElement?.querySelector<HTMLElement>(
      `[data-testid="${testId}"]`,
    ) ?? null
  );
}

/**
 * 選択欄の直下に並ぶもの。節は見出しで、節の外の選択肢は値で表す。
 *
 * @param select 読む選択欄
 * @returns 直下の子を欄に並んだ順で並べたもの
 */
function topLevelOf(select: HTMLElement): readonly string[] {
  return [...select.children].map((child) => {
    if (child instanceof HTMLOptGroupElement) {
      return `optgroup:${child.label}`;
    }
    return child instanceof HTMLOptionElement
      ? `option:${child.value}`
      : child.tagName;
  });
}

/**
 * 選択欄の節の見出しと、その中の選択肢。
 *
 * @param select 節を読む選択欄
 * @returns 節ごとの見出しと選択肢の値を、欄に並んだ順で並べたもの
 */
function optionGroupsOf(
  select: HTMLElement,
): readonly Readonly<{ label: string; values: readonly string[] }>[] {
  return [...select.querySelectorAll("optgroup")].map((group) => ({
    label: group.label,
    values: optionValuesOf(group),
  }));
}

test("何も選択していないときは選択されていないことを伝える", () => {
  renderSelected();

  expect(screen.getByText("選択されていません")).toBeDefined();
});

test("enum の prop は宣言された値ごとのセグメントになる", () => {
  renderSelected("home-title");

  const align = screen.getByRole("group", { name: "Align" });
  expect(
    within(align)
      .getAllByRole("button")
      .map((segment) => segment.textContent),
  ).toEqual(["left", "center", "right"]);
});

test("宣言に無い値が設定されている enum はその値もセグメントとして出る", () => {
  renderSelected("home-odd");

  expect(pressedSegmentsOf("Layout")).toEqual(["diagonal"]);
});

test("未指定の enum はどのセグメントも選ばれた状態にならない", () => {
  renderSelected("home-title");

  expect(pressedSegmentsOf("Align")).toEqual([]);
});

test("未指定の enum には何が効いているかが行に出る", () => {
  renderSelected("home-title");

  expect(screen.getByText("未指定（既定: left）")).toBeDefined();
});

test("値が入っている enum には未指定の注記が出ない", () => {
  /*
   * `home-odd` の `layout` は `diagonal`（既定 `column` を持つので注記の綴り自体は作れる）。
   * 未指定のときだけ出す、という出し分けを外すとここに注記が出て落ちる。
   */
  renderSelected("home-odd");

  expect(screen.queryByText("未指定（既定: column）")).toBeNull();
});

test("未指定のトークン参照は行の下ではなく選択肢の側に未指定を出す", () => {
  /*
   * 「セグメントのときだけ行の下に出す」を外すと、`<select>` の行にも同じ綴りの
   * 注記が並んで 2 件になり落ちる。
   */
  renderSelected("home-title");

  expect(
    screen
      .getAllByText("未指定（既定: body）")
      .map((element) => element.tagName),
  ).toEqual(["OPTION"]);
});

test("トークン参照の prop はトークン名から選ぶ入力欄になる", () => {
  renderSelected("home-title");

  expect(
    optionValuesOf(screen.getByRole("combobox", { name: "Color" })),
  ).toContain("primary");
});

test("塗りの欄は colors と gradients の名前を種別ごとの節に分けて出す", () => {
  renderSelected("home");

  expect(
    optionGroupsOf(screen.getByRole("combobox", { name: "Background" })),
  ).toEqual([
    { label: "colors", values: Object.keys(Tokens.colors) },
    { label: "gradients", values: ["brand"] },
  ]);
});

test("gradients を 1 つも持たない文書では、塗りの欄に gradients の節を出さない", () => {
  renderPanel(
    DocumentSelection.fromNames(
      DesignDocument.create({
        tokens: { ...Tokens, gradients: {} },
        artboards: [{ name: "home", width: 360, height: 240, children: [] }],
      }),
      ["home"],
    ),
  );

  expect(
    optionGroupsOf(screen.getByRole("combobox", { name: "Background" })).map(
      (group) => group.label,
    ),
  ).toEqual(["colors"]);
});

test("どちらの種別にも解決しない名前を指す塗りの欄は、その名前を節の外の先頭に出す", () => {
  renderSelected("home-odd");

  expect(
    topLevelOf(screen.getByRole("combobox", { name: "Background" })),
  ).toEqual([
    "option:",
    "option:missing",
    "optgroup:colors",
    "optgroup:gradients",
  ]);
});

test("解決する名前を指す塗りの欄は、その名前を節の外へ足さない", () => {
  renderSelected("home-banner");

  expect(
    topLevelOf(screen.getByRole("combobox", { name: "Background" })),
  ).toEqual(["option:", "optgroup:colors", "optgroup:gradients"]);
});

test("colors と gradients の両方にある名前は、塗りの欄のどちらの節にも出ない", () => {
  renderPanel(
    DocumentSelection.fromNames(
      DesignDocument.create({
        tokens: { ...Tokens, colors: { ...Tokens.colors, brand: "#123456" } },
        artboards: [{ name: "home", width: 360, height: 240, children: [] }],
      }),
      ["home"],
    ),
  );

  expect(
    optionGroupsOf(
      screen.getByRole("combobox", { name: "Background" }),
    ).flatMap((group) => group.values),
  ).not.toContain("brand");
});
test("未指定のトークン参照は既定値付きの未指定が選ばれ、明示設定と区別できる", () => {
  renderSelected("home-title");

  expect(
    screen.getByRole("option", { name: "未指定（既定: body）" }),
  ).toHaveProperty("selected", true);
});

test("塗りの欄が colors の名前を指すと、その色の見本が出る", () => {
  renderSelected("home");

  const swatch = swatchNextTo(
    screen.getByRole("combobox", { name: "Background" }),
  );
  expect(swatch?.style.backgroundColor).toBe(Tokens.colors.white);
});

test("色のトークン参照には今効いている色の見本が出る", () => {
  renderSelected("home-title");

  const swatch = swatchNextTo(screen.getByRole("combobox", { name: "Color" }));
  expect(swatch?.style.backgroundColor).toBe(Tokens.colors["gray-900"]);
});

test("上書きしていない塗りの公開 prop には、部品が設定している階調の見本が出る", () => {
  renderPanel(
    DocumentSelection.fromNames(
      DesignDocument.create({
        tokens: Tokens,
        components: {
          "banner-card": {
            publicProps: {
              background: { node: "banner-card", prop: "background" },
            },
            type: "Box",
            props: { background: "brand" },
            children: [],
          },
        },
        artboards: [
          {
            name: "home",
            width: 360,
            height: 240,
            children: [{ name: "home-banner-card", ref: "banner-card" }],
          },
        ],
      }),
      ["home-banner-card"],
    ),
  );

  expect(
    swatchNextTo(
      screen.getByRole("combobox", { name: "Background" }),
      GradientSwatchTestId,
    ),
  ).not.toBeNull();
});

test("colors の名前を指す塗りの欄には階調の見本が出ない", () => {
  renderSelected("home");

  expect(
    swatchNextTo(
      screen.getByRole("combobox", { name: "Background" }),
      GradientSwatchTestId,
    ),
  ).toBeNull();
});

test("gradients の名前を指す塗りの欄には、その階調の見本が出る", () => {
  renderSelected("home-banner");

  const swatch = swatchNextTo(
    screen.getByRole("combobox", { name: "Background" }),
    GradientSwatchTestId,
  );
  expect(swatch?.style.backgroundImage).toBe(
    GradientToken.cssValue(Tokens.gradients.brand),
  );
});

test("gradients の名前を指す塗りの欄には色の見本が出ない", () => {
  renderSelected("home-banner");

  expect(
    swatchNextTo(screen.getByRole("combobox", { name: "Background" })),
  ).toBeNull();
});

test("数値のトークン参照には解決後の値が欄の説明として添えて出る", () => {
  renderSelected("home");

  expect(
    screen.getByRole("combobox", { name: "Gap", description: "16" }),
  ).toBeDefined();
});

test("実在しないトークンを指す数値の prop には解決値が出ない", () => {
  /*
   * 同じ画面の `Padding Horizontal` が対照（左右とも `sm` → 8）。何も出ない入力で
   * 確かめると、併記を丸ごと消しても通ってしまう。
   */
  renderSelected("home-odd");

  expect(
    screen.getByRole("combobox", {
      name: "Padding Horizontal",
      description: "8",
    }),
  ).toBeDefined();
  expect(
    screen
      .getByRole("combobox", { name: "Gap" })
      .getAttribute("aria-describedby"),
  ).toBeNull();
});

test("数値にならないトークン参照には解決値が出ない", () => {
  /*
   * `home-odd` の `shadow` には実在する `sm` を入れてある（解決できる値を持たせないと、
   * 併記が無いのが種別のせいなのか値が無いせいなのか分からない）。
   * 欄そのものは残っていることまで見るのは、欄ごと消えても通る形にしないため。
   */
  renderSelected("home-odd");

  expect(
    screen
      .getByRole("combobox", { name: "Shadow" })
      .getAttribute("aria-describedby"),
  ).toBeNull();
});

test("色以外のトークン参照には色の見本が出ない", () => {
  renderSelected("home");

  expect(
    swatchNextTo(screen.getByRole("combobox", { name: "Gap" })),
  ).toBeNull();
});

test("実在しないトークンを指す色の prop には見本が出ない", () => {
  renderSelected("home-odd");

  expect(
    swatchNextTo(screen.getByRole("combobox", { name: "Background" })),
  ).toBeNull();
});

test("文字列の生リテラルの prop は文字入力欄になり、設定されている値が出る", () => {
  renderSelected("home-title");

  expect(screen.getByRole("textbox", { name: "Content" })).toHaveProperty(
    "value",
    "ホーム",
  );
});

test("数値の生リテラルの prop は数値入力欄になる", () => {
  renderSelected("home-body");

  expect(screen.getByRole("spinbutton", { name: "Width" })).toBeDefined();
});

test("既定を持たない未指定の prop は未指定とだけ出る", () => {
  renderSelected("home-body");

  expect(screen.getByRole("spinbutton", { name: "Width" })).toHaveProperty(
    "placeholder",
    "未指定",
  );
});

test("prop 名は camelCase の切れ目で語に分けた表示名になる", () => {
  renderSelected("home-body");

  expect(screen.getByRole("group", { name: "Width Mode" })).toBeDefined();
});

test("group ごとのセクションが見出しとして出る", () => {
  renderSelected("home-title");

  expect(screen.getByRole("heading", { name: "Content" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "Appearance" })).toBeDefined();
});

test("インスタンスを選ぶと部品が公開している prop の入力欄が出る", () => {
  renderSelected("home-action");

  expect(screen.getByRole("textbox", { name: "Label" })).toBeDefined();
});

test("artboard を選ぶと Box の prop が編集できる", () => {
  renderSelected("home");

  expect(screen.getByRole("combobox", { name: "Background" })).toBeDefined();
});

test("artboard のサイズは props で変えられないので入力欄が出ない", () => {
  renderSelected("home");

  expect(screen.queryByRole("group", { name: "Width Mode" })).toBeNull();
});

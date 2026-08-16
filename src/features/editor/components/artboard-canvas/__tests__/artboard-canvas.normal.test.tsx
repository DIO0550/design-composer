import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { renderCanvas } from "./setup";

/** artboard の並びだけを差し替えたエディタ状態（トークンと部品は雛形をそのまま使う）。 */
function setupState(
  artboards: Parameters<typeof DesignDocument.create>[0]["artboards"],
): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
      artboards,
    }),
  );
}

/** 画面に出ている artboard を、描画されている順に並べた名前。 */
function renderedArtboardNames(): readonly string[] {
  return screen
    .getAllByRole("button")
    .map((element) => element.getAttribute("aria-label"))
    .filter((name): name is string => name !== null);
}

test("artboard の中身がキャンバスに描画される", () => {
  const state = setupState([
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        { name: "home-title", type: "Text", props: { content: "ホーム" } },
      ],
    },
  ]);

  renderCanvas({ state });

  expect(screen.getByText("ホーム")).toBeDefined();
});

test("部品インスタンスは overrides を適用した中身で描画される", () => {
  const state = setupState([
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        {
          name: "home-login",
          ref: "primary-button",
          overrides: { label: "ログイン" },
        },
      ],
    },
  ]);

  renderCanvas({ state });

  expect(screen.getByText("ログイン")).toBeDefined();
});

test("artboard は artboards 配列の順に並ぶ", () => {
  const state = setupState([
    { name: "home", width: 360, height: 240, children: [] },
    { name: "settings", width: 360, height: 240, children: [] },
    { name: "about", width: 360, height: 240, children: [] },
  ]);

  renderCanvas({ state });

  expect(renderedArtboardNames()).toEqual(["home", "settings", "about"]);
});

test("artboard は自身の幅と高さで描画される", () => {
  const state = setupState([
    { name: "home", width: 360, height: 240, children: [] },
  ]);

  renderCanvas({ state });

  const frame = document.querySelector('[data-name="home"]');
  expect(frame?.getAttribute("style")).toContain("width:360px");
  expect(frame?.getAttribute("style")).toContain("height:240px");
});

test("artboard からはみ出した中身はデフォルトで clip される", () => {
  const state = setupState([
    {
      name: "home",
      width: 240,
      height: 160,
      children: [
        {
          name: "home-wide",
          type: "Box",
          props: {
            widthMode: "fixed",
            width: 480,
            heightMode: "fixed",
            height: 320,
          },
          children: [],
        },
      ],
    },
  ]);

  renderCanvas({ state });

  const frame = document.querySelector('[data-name="home"]');
  expect(frame?.getAttribute("style")).toContain("overflow:hidden");
});

test("トークンはキャンバス側のカスタムプロパティとして与えられる", () => {
  const state = setupState([
    {
      name: "home",
      width: 360,
      height: 240,
      props: { background: "primary" },
      children: [],
    },
  ]);

  renderCanvas({ state });

  const frame = document.querySelector('[data-name="home"]');
  expect(frame?.getAttribute("style")).toContain("var(--colors-primary)");
  expect(screen.getByRole("list").getAttribute("style")).toContain(
    "--colors-primary",
  );
});

test("選択中の artboard は選択状態として示される", () => {
  const state = EditorState.select(
    setupState([
      { name: "home", width: 360, height: 240, children: [] },
      { name: "settings", width: 360, height: 240, children: [] },
    ]),
    "settings",
  );

  renderCanvas({ state });

  expect(
    screen
      .getByRole("button", { name: "settings" })
      .getAttribute("aria-current"),
  ).toBe("true");
  expect(
    screen.getByRole("button", { name: "home" }).getAttribute("aria-current"),
  ).toBe("false");
});

test("artboard が無いときはその旨が表示される", () => {
  const state = EditorState.create(DesignDocument.create({ artboards: [] }));

  renderCanvas({ state });

  expect(screen.getByText("artboard がありません")).toBeDefined();
});

test("コンパイルに失敗したときは失敗した旨が表示される", () => {
  const state = setupState([
    {
      name: "home",
      width: 360,
      height: 240,
      children: [{ name: "home-missing", ref: "unknown-component" }],
    },
  ]);

  renderCanvas({ state });

  expect(screen.getByText(/コンパイルに失敗しました/)).toBeDefined();
  expect(screen.queryByText("artboard がありません")).toBeNull();
});

test("artboard のラベルには、その artboard 自身の大きさが出る", () => {
  // 大きさの違う 2 枚を置く。1 枚だと先頭固定・幅と高さの取り違えでも通る
  const state = setupState([
    { name: "home", width: 360, height: 240, children: [] },
    { name: "settings", width: 720, height: 900, children: [] },
  ]);

  renderCanvas({ state });

  expect(
    screen.getAllByText(/^\d+ × \d+$/).map((size) => size.textContent),
  ).toStrictEqual(["360 × 240", "720 × 900"]);
});

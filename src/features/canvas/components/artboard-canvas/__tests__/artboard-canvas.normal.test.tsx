import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { renderCanvas } from "./setup";

/**
 * artboard の並びだけを差し替えたドキュメントと、選択の対
 * （トークンと部品は雛形をそのまま使う）。
 */
function setupSelection(
  artboards: Parameters<typeof DesignDocument.create>[0]["artboards"],
  selectedNames: readonly string[] = [],
): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
      artboards,
    }),
    selectedNames,
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
  const selection = setupSelection([
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        { name: "home-title", type: "Text", props: { content: "ホーム" } },
      ],
    },
  ]);

  renderCanvas({ selection });

  expect(screen.getByText("ホーム")).toBeDefined();
});

test("部品インスタンスは overrides を適用した中身で描画される", () => {
  const selection = setupSelection([
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

  renderCanvas({ selection });

  expect(screen.getByText("ログイン")).toBeDefined();
});

test("artboard は artboards 配列の順に並ぶ", () => {
  const selection = setupSelection([
    { name: "home", width: 360, height: 240, children: [] },
    { name: "settings", width: 360, height: 240, children: [] },
    { name: "about", width: 360, height: 240, children: [] },
  ]);

  renderCanvas({ selection });

  expect(renderedArtboardNames()).toEqual(["home", "settings", "about"]);
});

test("artboard は自身の幅と高さで描画される", () => {
  const selection = setupSelection([
    { name: "home", width: 360, height: 240, children: [] },
  ]);

  renderCanvas({ selection });

  const frame = document.querySelector('[data-name="home"]');
  expect(frame?.getAttribute("style")).toContain("width:360px");
  expect(frame?.getAttribute("style")).toContain("height:240px");
});

test("artboard からはみ出した中身はデフォルトで clip される", () => {
  const selection = setupSelection([
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

  renderCanvas({ selection });

  const frame = document.querySelector('[data-name="home"]');
  expect(frame?.getAttribute("style")).toContain("overflow:hidden");
});

test("トークンはキャンバス側のカスタムプロパティとして与えられる", () => {
  const selection = setupSelection([
    {
      name: "home",
      width: 360,
      height: 240,
      props: { background: "primary" },
      children: [],
    },
  ]);

  renderCanvas({ selection });

  const frame = document.querySelector('[data-name="home"]');
  expect(frame?.getAttribute("style")).toContain("var(--colors-primary)");
  expect(screen.getByRole("list").getAttribute("style")).toContain(
    "--colors-primary",
  );
});

test("選択中の artboard は選択状態として示される", () => {
  const selection = setupSelection(
    [
      { name: "home", width: 360, height: 240, children: [] },
      { name: "settings", width: 360, height: 240, children: [] },
    ],
    ["settings"],
  );

  renderCanvas({ selection });

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
  const selection = DocumentSelection.fromNames(
    DesignDocument.create({ artboards: [] }),
    [],
  );

  renderCanvas({ selection });

  expect(screen.getByText("artboard がありません")).toBeDefined();
});

test("コンパイルに失敗したときは失敗した旨が表示される", () => {
  const selection = setupSelection([
    {
      name: "home",
      width: 360,
      height: 240,
      children: [{ name: "home-missing", ref: "unknown-component" }],
    },
  ]);

  renderCanvas({ selection });

  expect(screen.getByText(/コンパイルに失敗しました/)).toBeDefined();
  expect(screen.queryByText("artboard がありません")).toBeNull();
});

test("artboard のラベルには、その artboard 自身の大きさが出る", () => {
  // 大きさの違う 2 枚を置く。1 枚だと先頭固定・幅と高さの取り違えでも通る
  const selection = setupSelection([
    { name: "home", width: 360, height: 240, children: [] },
    { name: "settings", width: 720, height: 900, children: [] },
  ]);

  renderCanvas({ selection });

  expect(
    screen.getAllByText(/^\d+ × \d+$/).map((size) => size.textContent),
  ).toStrictEqual(["360 × 240", "720 × 900"]);
});

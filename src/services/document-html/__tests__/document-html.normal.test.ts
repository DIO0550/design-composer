import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import type { TokenSet } from "@/domains/token";
import { Result } from "@/utils/Result";
import { DocumentHtml } from "../index";

function setupTokens(): TokenSet {
  return {
    colors: { white: "#ffffff", primary: "#3b82f6", "gray-900": "#111827" },
    spacing: { md: 16 },
    radius: {},
    shadows: {},
    typography: {
      body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
    },
  };
}

test("artboard は固定サイズの Box としてコンパイルされる", () => {
  const document = DesignDocument.create({
    artboards: [
      { name: "login-screen", width: 375, height: 812, children: [] },
    ],
  });

  const compiled = Result.unwrap(DocumentHtml.compile(document));

  expect(compiled.artboards[0]?.element.style).toMatchObject({
    display: "flex",
    width: "375px",
    height: "812px",
  });
});

test("artboard のはみ出しは既定で隠される", () => {
  const document = DesignDocument.create({
    artboards: [
      { name: "login-screen", width: 375, height: 812, children: [] },
    ],
  });

  const compiled = Result.unwrap(DocumentHtml.compile(document));

  expect(compiled.artboards[0]?.element.style.overflow).toBe("hidden");
});

test("artboard の props は Box のマッピングで CSS になる", () => {
  const document = DesignDocument.create({
    tokens: setupTokens(),
    artboards: [
      {
        name: "login-screen",
        width: 375,
        height: 812,
        props: { direction: "row", gap: "md", background: "primary" },
        children: [],
      },
    ],
  });

  const compiled = Result.unwrap(DocumentHtml.compile(document));

  expect(compiled.artboards[0]?.element.style).toMatchObject({
    "flex-direction": "row",
    gap: "var(--spacing-md)",
    background: "var(--colors-primary)",
  });
});

test("トークンはルート要素のカスタムプロパティになる", () => {
  const document = DesignDocument.create({ tokens: setupTokens() });

  const compiled = Result.unwrap(DocumentHtml.compile(document));

  expect(compiled.variables).toMatchObject({
    "--colors-white": "#ffffff",
    "--colors-primary": "#3b82f6",
    "--spacing-md": "16px",
  });
});

test("artboard の子はツリーの構造のまま入れ子の要素になる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "login-screen",
        width: 375,
        height: 812,
        children: [
          {
            name: "login-form",
            type: "Box",
            children: [{ name: "title", type: "Text" }],
          },
        ],
      },
    ],
  });

  const compiled = Result.unwrap(DocumentHtml.compile(document));
  const form = compiled.artboards[0]?.element.children[0];

  expect(form?.name).toBe("login-form");
  expect(form?.kind === "box" && form.children[0]?.name).toBe("title");
});

test("artboard の子の fill は artboard の並べる向きで決まる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "login-screen",
        width: 375,
        height: 812,
        props: { direction: "row" },
        children: [
          { name: "sidebar", type: "Box", props: { widthMode: "fill" } },
        ],
      },
    ],
  });

  const compiled = Result.unwrap(DocumentHtml.compile(document));
  const sidebar = compiled.artboards[0]?.element.children[0];

  expect(sidebar?.style["flex-grow"]).toBe("1");
});

test("部品インスタンスは展開されてから要素になる", () => {
  const document = DesignDocument.create({
    components: {
      "primary-button": {
        type: "Box",
        children: [{ name: "primary-button-label", type: "Text" }],
      },
    },
    artboards: [
      {
        name: "login-screen",
        width: 375,
        height: 812,
        children: [{ name: "login-submit", ref: "primary-button" }],
      },
    ],
  });

  const compiled = Result.unwrap(DocumentHtml.compile(document));
  const instance = compiled.artboards[0]?.element.children[0];

  expect(instance?.name).toBe("login-submit");
  expect(instance?.kind === "box" && instance.children[0]?.name).toBe(
    "primary-button-label",
  );
});

test("artboard は配列順のまま並ぶ", () => {
  const document = DesignDocument.create({
    artboards: [
      { name: "first", width: 100, height: 100, children: [] },
      { name: "second", width: 100, height: 100, children: [] },
    ],
  });

  const compiled = Result.unwrap(DocumentHtml.compile(document));

  expect(compiled.artboards.map((artboard) => artboard.element.name)).toEqual([
    "first",
    "second",
  ]);
});

test("ドキュメント1つからレンダリング可能な HTML が得られる", () => {
  const document = DesignDocument.create({
    tokens: setupTokens(),
    artboards: [
      {
        name: "login-screen",
        width: 375,
        height: 812,
        props: { background: "white" },
        children: [
          { name: "title", type: "Text", props: { content: "ログイン" } },
        ],
      },
    ],
  });

  const html = Result.unwrap(DocumentHtml.toHtml(document));

  const rootVariables = [
    "--colors-white:#ffffff",
    "--colors-primary:#3b82f6",
    "--colors-gray-900:#111827",
    "--spacing-md:16px",
    "--typography-body-font-size:16px",
    "--typography-body-line-height:1.6",
    "--typography-body-font-weight:400",
    "--typography-body-font-family:system-ui, -apple-system, &quot;Segoe UI&quot;," +
      " Roboto, &quot;Helvetica Neue&quot;, Arial, sans-serif",
  ].join(";");
  const artboardStyle = [
    "display:flex",
    "flex-direction:column",
    "align-items:stretch",
    "justify-content:start",
    "width:375px",
    "height:812px",
    "background:var(--colors-white)",
    "overflow:hidden",
  ].join(";");
  const titleStyle = [
    "font-size:var(--typography-body-font-size)",
    "line-height:var(--typography-body-line-height)",
    "font-weight:var(--typography-body-font-weight)",
    "font-family:var(--typography-body-font-family)",
    "color:var(--colors-gray-900)",
    "text-align:left",
  ].join(";");

  expect(html).toBe(
    `<div style="${rootVariables}">` +
      `<div data-name="login-screen" style="${artboardStyle}">` +
      `<div data-name="title" style="${titleStyle}">ログイン</div>` +
      "</div>" +
      "</div>",
  );
});

test("コンパイル結果は artboard ごとに宣言された大きさを持つ", () => {
  // 大きさの違う 2 枚を置く。1 枚だと「先頭の大きさを全部に配る」実装でも通る
  const document = DesignDocument.create({
    artboards: [
      { name: "home", width: 360, height: 240, children: [] },
      { name: "settings", width: 720, height: 900, children: [] },
    ],
  });

  const compiled = Result.unwrap(DocumentHtml.compile(document));

  expect(
    compiled.artboards.map((artboard) => [artboard.width, artboard.height]),
  ).toStrictEqual([
    [360, 240],
    [720, 900],
  ]);
});

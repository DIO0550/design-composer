import { expect, test } from "vitest";
import { TokenSet } from "@/domains/token";
import {
  DesignDocument,
  type DesignDocument as Document,
  TokenReferrer,
} from "../index";

const GRAY_900 = { kind: "colors", name: "gray-900" } as const;

/**
 * 色を 2 つ持つトークンセット。
 * 「集まらない」ことを確かめるテストでも、同じ土台で集まる側を確かめられるようにする。
 */
function twoColors(): TokenSet {
  return {
    ...TokenSet.empty(),
    colors: { "gray-900": "#111827", "gray-500": "#6b7280" },
  };
}

/**
 * 公開 prop を 2 つ持つ部品と、そのインスタンスを載せたドキュメント。
 * `tone` はトークン参照 prop（Box の `background`）へ、`label` は生の値の prop
 * （Text の `content`）へ binding してある。
 */
function setupInstanceDocument(
  overrides: Readonly<Record<string, string>>,
): Document {
  return DesignDocument.create({
    tokens: twoColors(),
    components: {
      badge: {
        type: "Box",
        publicProps: {
          tone: { node: "badge-body", prop: "background" },
          label: { node: "badge-label", prop: "content" },
        },
        children: [
          { name: "badge-body", type: "Box", children: [] },
          { name: "badge-label", type: "Text" },
        ],
      },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
          { name: "login-badge", ref: "badge", overrides },
        ],
      },
    ],
  });
}

test("同じ名前でも種別が違うトークンは参照元にならない", () => {
  const document = DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { md: "#111827" },
      spacing: { md: 16 },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          {
            name: "login-form",
            type: "Box",
            props: { gap: "md", background: "md" },
            children: [],
          },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, {
    kind: "colors",
    name: "md",
  });

  expect(referrers.map(TokenReferrer.toText)).toEqual([
    "login-form.background",
  ]);
});

test("トークンを引かない prop に同じ文字列が入っていても参照元にならない", () => {
  const document = DesignDocument.create({
    tokens: twoColors(),
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          {
            name: "title",
            type: "Text",
            props: { content: "gray-900", color: "gray-900" },
          },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, GRAY_900);

  expect(referrers.map(TokenReferrer.toText)).toEqual(["title.color"]);
});

test("スキーマに宣言の無い prop がトークン名と同じ値を持っていても参照元にならない", () => {
  const document = DesignDocument.create({
    tokens: twoColors(),
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          {
            name: "login-form",
            type: "Box",
            props: { borderColor: "gray-900", background: "gray-900" },
            children: [],
          },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, GRAY_900);

  expect(referrers.map(TokenReferrer.toText)).toEqual([
    "login-form.background",
  ]);
});

test("スキーマに無い type のノードの props は参照元にならない", () => {
  const document = DesignDocument.create({
    tokens: twoColors(),
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          {
            name: "mystery",
            type: "Widget",
            props: { background: "gray-900" },
          },
          {
            name: "login-form",
            type: "Box",
            props: { background: "gray-900" },
            children: [],
          },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, GRAY_900);

  expect(referrers.map(TokenReferrer.toText)).toEqual([
    "login-form.background",
  ]);
});

test("デフォルトで解決されるトークンは参照元にならない", () => {
  /* Text の `color` はデフォルトが `gray-900`（docs/03-schema.md）。設定していないノードは数えない。 */
  const document = DesignDocument.create({
    tokens: twoColors(),
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          { name: "caption", type: "Text", props: { color: "gray-500" } },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, GRAY_900);

  expect(referrers).toEqual([]);
});

test("設定されている prop はデフォルトを持つ prop でも参照元になる", () => {
  const document = DesignDocument.create({
    tokens: twoColors(),
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          { name: "caption", type: "Text", props: { color: "gray-500" } },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, {
    kind: "colors",
    name: "gray-500",
  });

  expect(referrers.map(TokenReferrer.toText)).toEqual(["caption.color"]);
});

test("公開 prop が生の値の prop へ binding されているとき、上書きの値がトークン名と同じでも参照元にならない", () => {
  const document = setupInstanceDocument({ label: "gray-900" });

  const referrers = DesignDocument.collectTokenReferrers(document, GRAY_900);

  expect(referrers.map(TokenReferrer.toText)).toEqual(["title.color"]);
});

test("宣言されていない公開 prop の上書きは参照元にならない", () => {
  const document = setupInstanceDocument({ tint: "gray-900" });

  const referrers = DesignDocument.collectTokenReferrers(document, GRAY_900);

  expect(referrers.map(TokenReferrer.toText)).toEqual(["title.color"]);
});

test("定義の無い部品を指すインスタンスの上書きは参照元にならない", () => {
  const document = DesignDocument.create({
    tokens: twoColors(),
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
          { name: "ghost", ref: "missing", overrides: { tone: "gray-900" } },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, GRAY_900);

  expect(referrers.map(TokenReferrer.toText)).toEqual(["title.color"]);
});

test("ドキュメントに無いトークン名を指す prop も参照元として集まる", () => {
  const document = DesignDocument.create({
    tokens: twoColors(),
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [{ name: "title", type: "Text", props: { color: "ghost" } }],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, {
    kind: "colors",
    name: "ghost",
  });

  expect(referrers.map(TokenReferrer.toText)).toEqual(["title.color"]);
});

test("どこからも参照されていないトークンでは参照元が空になる", () => {
  const document = DesignDocument.create({
    tokens: twoColors(),
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text", props: { color: "gray-500" } },
        ],
      },
    ],
  });

  const referrers = DesignDocument.collectTokenReferrers(document, GRAY_900);

  expect(referrers).toEqual([]);
});

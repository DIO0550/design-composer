import { expect, test } from "vitest";
import { DesignDocument, TokenReferrer } from "@/domains/dcmp/design-document";
import { type TokenRef, TokenSet } from "@/domains/dcmp/token";
import { Option } from "@/utils/Option";
import { TokenSelection } from "../index";

/**
 * 2 つの色がそれぞれ別の箇所から参照されているドキュメント。
 * 選んだトークンの参照元だけが引けることを、既定値（片方）と違う答えで確かめられる。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { "gray-900": "#111827", primary: "#3b82f6" },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
          {
            name: "login-form",
            type: "Box",
            props: { background: "primary" },
            children: [],
          },
        ],
      },
    ],
  });
}

/** そのトークンを選んでいる状態。 */
function selectionOf(document: DesignDocument, ref: TokenRef): TokenSelection {
  return TokenSelection.create(document, Option.some(ref));
}

test("トークンを選ぶと、そのトークンを参照している箇所が引ける", () => {
  const selection = selectionOf(setupDocument(), {
    kind: "colors",
    name: "gray-900",
  });

  const referrers = TokenSelection.collectReferrers(selection);

  expect(referrers.map(TokenReferrer.toText)).toEqual(["title.color"]);
});

test("別のトークンを選ぶと、参照元もそのトークンのものになる", () => {
  const selection = selectionOf(setupDocument(), {
    kind: "colors",
    name: "primary",
  });

  expect(
    TokenSelection.collectReferrers(selection).map(TokenReferrer.toText),
  ).toEqual(["login-form.background"]);
});

test("トークンを選んでいないときは参照元が空になる", () => {
  const selection = TokenSelection.create(setupDocument(), Option.none);

  const referrers = TokenSelection.collectReferrers(selection);

  expect(referrers).toEqual([]);
});

test("部品定義の中のノードが参照していても、破線の相手には並ばない", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    components: {
      badge: {
        type: "Box",
        children: [
          {
            name: "badge-body",
            type: "Box",
            props: { background: "gray-900" },
          },
        ],
      },
    },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        // 同じトークンをキャンバス上からも 1 件指させ、集めすぎと集め漏れの両方で落ちるようにする
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
        ],
      },
    ],
  });

  const selection = selectionOf(document, { kind: "colors", name: "gray-900" });

  expect(TokenSelection.collectCanvasReferrerNames(selection)).toEqual([
    "title",
  ]);
});

test("artboard 自身が参照していても、破線の相手には並ばない", () => {
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        props: { background: "gray-900" },
        children: [
          { name: "title", type: "Text", props: { color: "gray-900" } },
        ],
      },
    ],
  });

  const selection = selectionOf(document, { kind: "colors", name: "gray-900" });

  expect(TokenSelection.collectCanvasReferrerNames(selection)).toEqual([
    "title",
  ]);
});

test("デフォルトで解決されるトークンを選ぶと、そのノードも破線の相手に並ぶ", () => {
  /*
   * Text の `color` の既定は `gray-900`。破線が指すのは「そのトークンが効いているノード」
   * なので、書いていないノードにも掛かる。明示した側を 1 件並べて対照にする。
   */
  const document = DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
    artboards: [
      {
        name: "login",
        width: 375,
        height: 812,
        children: [
          { name: "plain", type: "Text" },
          { name: "title", type: "Text", props: { color: "gray-900" } },
        ],
      },
    ],
  });

  const selection = selectionOf(document, { kind: "colors", name: "gray-900" });

  expect(TokenSelection.collectCanvasReferrerNames(selection)).toEqual([
    "plain",
    "title",
  ]);
});

test("別のトークンを選ぶと、破線の相手もそのトークンのものになる", () => {
  const selection = selectionOf(setupDocument(), {
    kind: "colors",
    name: "primary",
  });

  expect(TokenSelection.collectCanvasReferrerNames(selection)).toEqual([
    "login-form",
  ]);
});

test("トークンを選んでいないときは破線の相手が空になる", () => {
  const selection = TokenSelection.create(setupDocument(), Option.none);

  expect(TokenSelection.collectCanvasReferrerNames(selection)).toEqual([]);
});

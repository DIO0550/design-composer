import { expect, test } from "vitest";
import { DesignDocument, TokenReferrer } from "@/domains/design-document";
import { TokenSet } from "@/domains/token";
import { EditorState } from "../index";

/**
 * 2 つの色がそれぞれ別の箇所から参照されているドキュメントの編集状態。
 * 選択したトークンの参照元だけが引けることを、既定値（片方）と違う答えで確かめられる。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
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
    }),
  );
}

test("トークンを選ぶと、そのトークンを参照している箇所が引ける", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "colors",
    name: "gray-900",
  });

  const referrers = EditorState.tokenReferrers(state);

  expect(referrers.map(TokenReferrer.toText)).toEqual(["title.color"]);
});

test("トークンを選び直すと、参照元も選び直したトークンのものになる", () => {
  const selectedFirst = EditorState.selectToken(setupState(), {
    kind: "colors",
    name: "gray-900",
  });

  const state = EditorState.selectToken(selectedFirst, {
    kind: "colors",
    name: "primary",
  });

  expect(EditorState.tokenReferrers(state).map(TokenReferrer.toText)).toEqual([
    "login-form.background",
  ]);
});

test("トークンを選んでいないときは参照元が空になる", () => {
  const state = setupState();

  const referrers = EditorState.tokenReferrers(state);

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

  const state = EditorState.selectToken(EditorState.create(document), {
    kind: "colors",
    name: "gray-900",
  });

  expect(EditorState.tokenReferrerNodeNames(state)).toEqual(["title"]);
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

  const state = EditorState.selectToken(EditorState.create(document), {
    kind: "colors",
    name: "gray-900",
  });

  expect(EditorState.tokenReferrerNodeNames(state)).toEqual(["title"]);
});

test("トークンを選び直すと、破線の相手も選び直したトークンのものになる", () => {
  const selectedFirst = EditorState.selectToken(setupState(), {
    kind: "colors",
    name: "gray-900",
  });

  const state = EditorState.selectToken(selectedFirst, {
    kind: "colors",
    name: "primary",
  });

  expect(EditorState.tokenReferrerNodeNames(state)).toEqual(["login-form"]);
});

test("トークンを選んでいないときは破線の相手が空になる", () => {
  const state = setupState();

  expect(EditorState.tokenReferrerNodeNames(state)).toEqual([]);
});

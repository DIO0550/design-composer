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

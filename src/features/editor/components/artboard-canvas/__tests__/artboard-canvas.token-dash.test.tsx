import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { TokenSet } from "@/domains/token";
import {
  canvasContent,
  tokenReferrerNames,
} from "@/features/editor/__tests__/canvas-elements";
import { EditorState } from "@/features/editor/domains/editor-state";
import { renderCanvas } from "./setup";

const GRAY_900 = { kind: "colors", name: "gray-900" } as const;

/**
 * `gray-900` を `title` だけが指し、`caption` は別の色を指すドキュメントの編集状態。
 * 参照しているノードだけが破線になる、を対照付きで確かめられる。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: {
        ...TokenSet.empty(),
        colors: { "gray-900": "#111827", "gray-500": "#6b7280" },
      },
      artboards: [
        {
          name: "login",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text", props: { color: "gray-900" } },
            { name: "caption", type: "Text", props: { color: "gray-500" } },
          ],
        },
      ],
    }),
  );
}

test("トークンを選ぶと、そのトークンを参照しているノードだけが破線になる", () => {
  renderCanvas({ state: EditorState.selectToken(setupState(), GRAY_900) });

  expect(tokenReferrerNames(canvasContent())).toEqual(["title"]);
});

test("トークンを選んでいなければ、参照があるドキュメントでも破線は出ない", () => {
  renderCanvas({ state: setupState() });

  expect(tokenReferrerNames(canvasContent())).toEqual([]);
});

test("2つのノードが同じトークンを指していると、その2つが破線になる", () => {
  const state = EditorState.create(
    DesignDocument.create({
      tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
      artboards: [
        {
          name: "login",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text", props: { color: "gray-900" } },
            { name: "caption", type: "Text", props: { color: "gray-900" } },
          ],
        },
      ],
    }),
  );

  renderCanvas({ state: EditorState.selectToken(state, GRAY_900) });

  expect(tokenReferrerNames(canvasContent())).toEqual(["title", "caption"]);
});

test("部品定義の中だけで参照しているノードは破線にならない", () => {
  const state = EditorState.create(
    DesignDocument.create({
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
          // キャンバス上からも 1 件指させ、集めすぎと集め漏れの両方で落ちるようにする
          children: [
            { name: "title", type: "Text", props: { color: "gray-900" } },
          ],
        },
      ],
    }),
  );

  renderCanvas({ state: EditorState.selectToken(state, GRAY_900) });

  expect(tokenReferrerNames(canvasContent())).toEqual(["title"]);
});

/**
 * 名前を指す規則のうち、その宣言を持つものが何番目に差し込まれたか。
 *
 * 同じ選択子・同じ詳細度の規則は後に書いたほうが勝つので、どちらが見えるかは
 * 差し込む順で決まる。happy-dom は CSS を解決しないため、順そのものを見る。
 *
 * @param name 規則が指している artboard / ノードの名前
 * @param declaration 探したい宣言の一部
 * @returns その規則の位置。見つからなければ -1
 */
function ruleIndexOf(name: string, declaration: string): number {
  const styles = [...canvasContent().querySelectorAll("style")];
  return styles.findIndex((style) => {
    const text = style.textContent ?? "";
    return text.includes(`"${name}"`) && text.includes(declaration);
  });
}

test("選択中のノードがそのトークンを参照していても、選択の枠が破線に負けない", () => {
  const selected = EditorState.select(
    EditorState.selectToken(setupState(), GRAY_900),
    "title",
  );

  renderCanvas({ state: selected });

  expect(ruleIndexOf("title", "dashed #0d99ff")).toBeGreaterThanOrEqual(0);
  expect(ruleIndexOf("title", "solid #3b82f6")).toBeGreaterThan(
    ruleIndexOf("title", "dashed #0d99ff"),
  );
});

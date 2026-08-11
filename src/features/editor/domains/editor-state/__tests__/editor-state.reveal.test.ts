import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * artboard 配下に 2 つのノードを持つ状態。部品定義は雛形のものをそのまま使う
 * （`primary-button-label` が部品定義の中のノードにあたる）。
 *
 * 部品定義の中のノードが要るのは、`DesignDocument.collectErrors` が部品定義も
 * 走査する一方で、選択の対象は artboard 配下だけだから（#136）。飛び先にならない
 * ことを確かめる相手として使う。
 */
function openedState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.DEFAULT.tokens,
      components: DocumentTemplate.DEFAULT.components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "home-title", type: "Text", props: { content: "ホーム" } },
            { name: "home-lead", type: "Text", props: { content: "ようこそ" } },
          ],
        },
      ],
    }),
  );
}

test("表示中のドキュメントに在るノードを指すと、そのノードが選ばれる", () => {
  // 別のノードを選択済みから始める（選択なしだと「何もしない」実装でも通る）
  const selected = EditorState.select(openedState(), "home-lead");

  const revealed = EditorState.reveal(selected, "home-title");

  expect(EditorState.isSelected(Option.unwrap(revealed), "home-title")).toBe(
    true,
  );
});

test("表示中のドキュメントに無いノードを指しても、選択は変わらない", () => {
  const selected = EditorState.select(openedState(), "home-lead");

  const revealed = EditorState.reveal(selected, "home-signup");

  expect(revealed.some).toBe(false);
});

test("部品定義の中のノードは飛び先にならない", () => {
  const selected = EditorState.select(openedState(), "home-lead");

  const revealed = EditorState.reveal(selected, "primary-button-label");

  expect(revealed.some).toBe(false);
});

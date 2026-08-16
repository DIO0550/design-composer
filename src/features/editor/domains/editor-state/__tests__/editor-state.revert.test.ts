import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { SampleSyntaxError } from "@/features/editor/__tests__/document-errors";
import { ReceivedAt } from "@/features/editor/__tests__/instants";
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
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
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

test("ファイルへ書き戻すと、ファイル由来のエラーは無くなる", () => {
  const rejected = EditorState.applyReload(
    openedState(),
    {
      kind: "rejected",
      errors: [SampleSyntaxError],
    },
    ReceivedAt,
  );

  const reverted = EditorState.applyRevert(rejected);

  expect(reverted.fileValidity.kind).toBe("valid");
});

test("ファイルへ書き戻しても、表示中のドキュメントは戻らない", () => {
  const rejected = EditorState.applyReload(
    openedState(),
    {
      kind: "rejected",
      errors: [SampleSyntaxError],
    },
    ReceivedAt,
  );

  const reverted = EditorState.applyRevert(rejected);

  // 履歴が伸びていないことを、undo で戻る先が無いことで見る
  expect(EditorState.undo(reverted).some).toBe(false);
});

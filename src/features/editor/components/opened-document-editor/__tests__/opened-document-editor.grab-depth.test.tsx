import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__";
import { drawn, renderOpenedDocument } from "./setup";

/*
 * ドラッグで掴むものが、クリックで選んだものと一致するところを編集画面の配線ごと確かめる
 * （docs/06-ui.md「キャンバス直接操作」の移動）。クリックで選択が変わり、その選択が掴む側
 * へ届くのは編集画面が `useNodeDrag` へ渡す選択を通してだけなので、キャンバス単体
 * （`artboard-canvas.grab-depth.test.tsx`）では見られない。
 */

/**
 * `home` に Box の `card`（中に Text の `label`）と空の Box `panel` が並ぶ。どれも `flow`
 * なので、運んで `panel` の上で離すとツリー内の移動になる。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      Artboard.create({
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "card",
            type: "Box",
            props: {},
            children: [
              { name: "label", type: "Text", props: { content: "札" } },
            ],
          },
          { name: "panel", type: "Box", props: {}, children: [] },
        ],
      }),
    ],
  });
}

/** 描かれた要素を包んでいる要素の名前（ドキュメント上の親）。 */
function drawnParentName(name: string): string | undefined {
  return drawn(name).parentElement?.dataset.name;
}

/** `label` の上で掴み、`panel` の上まで運んで離す。 */
function dragLabelOntoPanel(): void {
  pressPointer(drawn("label"), { x: 100, y: 100 });
  movePointer(drawn("panel"), { x: 100, y: 150 });
  releasePointer(drawn("panel"), { x: 100, y: 150 });
}

test("ダブルクリックで中身まで掘ってから同じところを運ぶと、掘った中身が動く", async () => {
  await renderOpenedDocument(setupDocument());
  await userEvent.dblClick(drawn("label"));

  dragLabelOntoPanel();

  // 掘った選択が掴む側へ届いていなければ、外側の `card` ごと `panel` へ移る
  expect(drawnParentName("label")).toBe("panel");
});

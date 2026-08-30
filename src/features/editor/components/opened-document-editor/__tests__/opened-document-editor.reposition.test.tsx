import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import {
  movePointer,
  pressPointer,
  releasePointer,
  renderedElement,
} from "@/features/canvas/__tests__";
import { canvasPane, renderOpenedDocument, tree } from "./setup";

/*
 * キャンバスで運んだ結果がドキュメントへ届き、描き直されるまでを編集画面の配線ごと
 * 確かめる（#381）。
 *
 * ここでしか通らないのは、`onReposition` → `reposition_node` → 再コンパイルまでを
 * 通して CSS の `left` / `top` が動くところを見るため。キャンバス単体
 * （`artboard-canvas.drag-placement.test.tsx`）はハンドラが呼ばれたことまでしか見ない。
 */

/**
 * `home` に絶対配置の `home-badge`・フローの `home-title` / `home-panel` が
 * この順で並ぶドキュメント。
 *
 * `home-badge` を**先頭**に置くのは、末尾だと「並びが変わらない」を確かめられないため。
 * happy-dom は矩形を返さないので落とし先は必ず末尾になり、末尾のノードを末尾へ移す
 * 木の移動は元と同じ並びになる（座標の置き直しを丸ごと壊しても通ってしまう）。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "home-badge",
            type: "Box",
            props: {
              placement: "absolute",
              x: 296,
              y: 16,
              widthMode: "fixed",
              width: 44,
              heightMode: "fixed",
              height: 24,
            },
            children: [],
          },
          {
            name: "home-title",
            type: "Text",
            props: { content: "ホーム" },
          },
          { name: "home-panel", type: "Box", props: {}, children: [] },
        ],
      },
    ],
  });
}

/** キャンバスに描かれているノードを名前で引く。 */
function drawn(name: string): HTMLElement {
  return renderedElement(canvasPane(), name);
}

/** ノードを掴んで運び、離すまで。移動量は縦横で違う値にする（取り違えを落とすため）。 */
function dragNode(from: Element, by: Readonly<{ x: number; y: number }>): void {
  pressPointer(from, { x: 100, y: 100 });
  movePointer(from, { x: 100 + by.x, y: 100 + by.y });
  releasePointer(from, { x: 100 + by.x, y: 100 + by.y });
}

test("絶対配置のノードをキャンバスで運ぶと、描かれる位置が縦横ともその分だけ動く", async () => {
  await renderOpenedDocument(setupDocument());

  // 動いた先が既定値（0）と一致しない量を選ぶ。一致させると「座標を書かない実装」でも通る
  dragNode(drawn("home-badge"), { x: -30, y: 12 });

  const moved = drawn("home-badge");
  expect([moved.style.left, moved.style.top]).toEqual(["266px", "28px"]);
});

test("絶対配置のノードを運んでもツリーの並びは変わらない", async () => {
  await renderOpenedDocument(setupDocument());

  dragNode(drawn("home-badge"), { x: -30, y: 12 });

  expect(rowNames(tree())).toEqual(["home-badge", "home-title", "home-panel"]);
});

test("フローのノードをキャンバスで運ぶと、座標ではなくツリーの並びが変わる", async () => {
  await renderOpenedDocument(setupDocument());

  dragNode(drawn("home-title"), { x: -30, y: 12 });

  expect(rowNames(tree())).toEqual(["home-badge", "home-panel", "home-title"]);
});

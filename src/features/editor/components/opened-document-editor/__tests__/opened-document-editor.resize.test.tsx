import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import {
  canvasContent,
  movePointer,
  pressPointer,
  releasePointer,
  stubBounds,
} from "@/features/canvas/__tests__";
import { drawn, renderOpenedDocument, selectInTree } from "./setup";

/*
 * キャンバスで掴んだ大きさがドキュメントへ届き、描き直され、1 回の undo で掴む前へ戻る
 * までを編集画面の配線ごと確かめる。
 *
 * ここでしか通らないのは、`onResize` → `resize` アクション → 再コンパイルまでを通して
 * まとまりの指定が届くところを見るため。キャンバス単体（`artboard-canvas.resize.test.tsx`）
 * は通知の値までは固定するが、それが履歴でどう扱われるかは見ない。
 */

/** 画面の (100, 50) に 200x100 で描かれている、という前提。右辺 x=300。 */
const PanelBounds = { left: 100, top: 50, width: 200, height: 100 };

/** 2 軸とも固定の `panel` と、そこへ座標も持たせた `badge` を持つドキュメント。 */
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
            name: "panel",
            type: "Box",
            props: {
              widthMode: "fixed",
              width: 200,
              heightMode: "fixed",
              height: 100,
            },
            children: [],
          },
          {
            name: "badge",
            type: "Box",
            props: {
              widthMode: "fixed",
              width: 200,
              heightMode: "fixed",
              height: 100,
              placement: "absolute",
              x: 25,
              y: 10,
            },
            children: [],
          },
        ],
      }),
    ],
  });
}

/**
 * `panel` の右辺を掴んで、**途中で 2 回以上動かして**から離す。
 *
 * 1 回しか動かさないと、刻みごとに履歴を積む実装でも undo 1 回で掴む前へ戻るため、
 * 直したい症状が出ない（`artboard-canvas.artboard-drag.test.tsx` が同じ性質を使っている）。
 */
function dragRightEdge(): void {
  stubBounds(drawn("panel"), PanelBounds);
  pressPointer(drawn("panel"), { x: 298, y: 100 });
  movePointer(canvasContent(), { x: 318, y: 100 });
  movePointer(canvasContent(), { x: 338, y: 100 });
  releasePointer(canvasContent(), { x: 338, y: 100 });
}

test("キャンバスで右辺を運ぶと、描かれる幅が動かした分だけ広がる", async () => {
  await renderOpenedDocument(setupDocument());
  await selectInTree("panel");

  dragRightEdge();

  expect(drawn("panel").style.width).toBe("240px");
});

test("運んだあと 1 回戻すと、描かれる幅が掴む前に戻る", async () => {
  await renderOpenedDocument(setupDocument());
  await selectInTree("panel");
  dragRightEdge();

  await userEvent.keyboard("{Control>}z{/Control}");

  // 掴む前の 200px。途中の 220px に戻るなら、刻みごとに履歴が積まれている
  expect(drawn("panel").style.width).toBe("200px");
});

test("続けて 2 回運ぶと、1 回戻るのは直前のドラッグの前まで", async () => {
  await renderOpenedDocument(setupDocument());
  await selectInTree("panel");
  dragRightEdge();
  stubBounds(drawn("panel"), { ...PanelBounds, width: 240 });
  pressPointer(drawn("panel"), { x: 338, y: 100 });
  movePointer(canvasContent(), { x: 358, y: 100 });
  movePointer(canvasContent(), { x: 378, y: 100 });
  releasePointer(canvasContent(), { x: 378, y: 100 });

  await userEvent.keyboard("{Control>}z{/Control}");

  // 2 回のドラッグが 1 件に畳まれるなら 200px まで戻ってしまう
  expect(drawn("panel").style.width).toBe("240px");
});

/**
 * `badge` の左辺を掴んで、**途中で 2 回以上動かして**から離す。
 *
 * 右辺のドラッグと同じ理由で 2 回動かす（1 回だと刻みごとに履歴を積む実装でも通る）。
 */
function dragLeftEdge(): void {
  stubBounds(drawn("badge"), PanelBounds);
  pressPointer(drawn("badge"), { x: 103, y: 100 });
  movePointer(canvasContent(), { x: 118, y: 100 });
  movePointer(canvasContent(), { x: 133, y: 100 });
  releasePointer(canvasContent(), { x: 133, y: 100 });
}

test("キャンバスで左辺を運ぶと、描かれる幅と左端が同時に動く", async () => {
  await renderOpenedDocument(setupDocument());
  await selectInTree("badge");

  dragLeftEdge();

  expect([drawn("badge").style.width, drawn("badge").style.left]).toEqual([
    "170px",
    "55px",
  ]);
});

test("左辺を運んだあと 1 回戻すと、幅も左端も掴む前に戻る", async () => {
  /*
   * 長さと位置を別々の編集として流すと、ここで片方だけが戻る
   * （docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。
   */
  await renderOpenedDocument(setupDocument());
  await selectInTree("badge");
  dragLeftEdge();

  await userEvent.keyboard("{Control>}z{/Control}");

  expect([drawn("badge").style.width, drawn("badge").style.left]).toEqual([
    "200px",
    "25px",
  ]);
});

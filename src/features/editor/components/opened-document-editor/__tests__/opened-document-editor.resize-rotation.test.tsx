import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import {
  canvasContent,
  drawnTurnedAt,
  movePointer,
  pressPointer,
  releasePointer,
  stubHeightFollowingWidth,
} from "@/features/editor/features/canvas/__tests__";
import { restoreComputedSize } from "@/libs/__tests__/element-measure";
import { drawn, renderOpenedDocument, selectInTree } from "./setup";

/*
 * 回ったノードの高さが幅につれて変わるリサイズを、編集画面の配線ごと通す（docs/06-ui.md
 * 「リサイズハンドル」）。置き直しの値そのものは `node-resize.ungrabbed-axis` が持つ。
 *
 * ここでしか通らないのは、1 回目の移動で描き直されて要素が作り直されたあとの 2 回目の移動で、
 * 作り直された要素へ長さを当てて測るところ。測り方の差し替えを名前で引くのはそのため。
 */

afterEach(restoreComputedSize);

/** `home` に、90 度回した幅 200・高さ `hug` の絶対配置の Box `turned` が (25, 10) に置かれている。 */
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
            name: "turned",
            type: "Box",
            props: {
              widthMode: "fixed",
              width: 200,
              heightMode: "hug",
              placement: "absolute",
              x: 25,
              y: 10,
              rotation: 90,
            },
            children: [],
          },
        ],
      }),
    ],
  });
}

/**
 * `turned` の回った右辺の帯を掴み、画面の下へ 2 回に分けて 50 引いてから離す。
 *
 * 外接矩形は (100, 0) から 100x200、回る前は 200x100 として描き、回る前の幅を当てると高さが
 * 連れて変わる（`stubHeightFollowingWidth`）ものとして測らせる。
 */
function dragWrappingRightEdge(): void {
  stubHeightFollowingWidth("turned");
  const turned = drawnTurnedAt(
    "turned",
    { left: 100, top: 0, width: 100, height: 200 },
    { width: 200, height: 100 },
  );
  pressPointer(turned, { x: 150, y: 195 });
  movePointer(canvasContent(), { x: 150, y: 220 });
  movePointer(canvasContent(), { x: 150, y: 245 });
  releasePointer(canvasContent(), { x: 150, y: 245 });
}

test("高さが幅につれて変わる回ったノードの右辺を 2 回に分けて運んで離すと、回る前の左上の角が留まる位置で描かれる", async () => {
  await renderOpenedDocument(setupDocument());
  await selectInTree("turned");

  dragWrappingRightEdge();

  const turned = drawn("turned");
  expect([turned.style.width, turned.style.left, turned.style.top]).toEqual([
    "250px",
    "10px",
    "45px",
  ]);
});

test("高さが幅につれて変わる回ったノードを運んだあと 1 回戻すと、幅も位置も掴む前に戻る", async () => {
  await renderOpenedDocument(setupDocument());
  await selectInTree("turned");
  dragWrappingRightEdge();

  await userEvent.keyboard("{Control>}z{/Control}");

  const turned = drawn("turned");
  expect([turned.style.width, turned.style.left, turned.style.top]).toEqual([
    "200px",
    "25px",
    "10px",
  ]);
});

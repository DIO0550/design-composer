import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { currentRowNames } from "@/components/__tests__/row-names";
import { segmentOf } from "@/components/__tests__/segmented-controls";
import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { rightPaneHeading } from "@/features/editor/__tests__/right-pane-heading";
import {
  canvasSurface,
  drag,
  hasNoTextInlineEditorField,
  renderedElement,
  stubBounds,
} from "@/features/editor/features/canvas/__tests__";
import {
  canvasPane,
  drawn,
  renderOpenedDocument,
  selectInTree,
  tree,
} from "./setup";

/*
 * 3 ペインを実物のまま組み立て、ロックしたノードがキャンバスの選択・直接操作から外れ、
 * ツリーとインスペクタからは扱えることを確かめる（docs/03「ロック」/ docs/06-ui.md「選択」）。
 */

/**
 * `home` に、ロックした絶対配置の `home-badge`・ロックした Text の `home-title`・
 * ロックしていない `home-panel` がこの順で並ぶドキュメント。
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
              locking: "locked",
            },
            children: [],
          },
          {
            name: "home-title",
            type: "Text",
            props: { content: "ホーム", locking: "locked" },
          },
          { name: "home-panel", type: "Box", props: {}, children: [] },
        ],
      }),
    ],
  });
}

test("キャンバスでロックしたノードを押すと、そのノードではなく artboard が選ばれる", async () => {
  await renderOpenedDocument(setupDocument());

  await userEvent.click(renderedElement(canvasPane(), "home-badge"));

  expect(within(rightPaneHeading()).getByText("home")).toBeDefined();
});

test("ツリーで選んだロック中のノードは、インスペクタでロックを外すとキャンバスで選べる", async () => {
  await renderOpenedDocument(setupDocument());
  await selectInTree("home-badge");
  await userEvent.click(segmentOf("Locking", "unlocked"));
  await selectInTree("home-panel");

  await userEvent.click(renderedElement(canvasPane(), "home-badge"));

  expect(currentRowNames(tree())).toEqual(["home-badge"]);
});

test("ロックしたノードを掴んで運んでも、描かれる位置は変わらない", async () => {
  await renderOpenedDocument(setupDocument());

  drag(drawn("home-badge"), {
    from: { x: 100, y: 100 },
    to: { x: 70, y: 112 },
  });

  const kept = drawn("home-badge");
  expect([kept.style.left, kept.style.top]).toEqual(["296px", "16px"]);
});

test("ツリーで選んだロック中の Text をダブルクリックしても、その場編集は始まらない", async () => {
  await renderOpenedDocument(setupDocument());
  await selectInTree("home-title");

  await userEvent.dblClick(renderedElement(canvasPane(), "home-title"));

  expect(hasNoTextInlineEditorField()).toBe(true);
});

test("キャンバスで範囲を引くと、範囲に入ったロック中のノードは選ばれず、ロックしていないノードだけが選ばれる", async () => {
  /*
   * 範囲選択の行き先が、ロック中を落とさない `EditorState.selectNodes` へ戻っても通らない
   * ように、2 つの答えが割れる入力（範囲にロック中とロックしていないノードを並べる）にする。
   */
  await renderOpenedDocument(setupDocument());
  stubBounds(drawn("home-title"), {
    left: 140,
    top: 84,
    width: 60,
    height: 20,
  });
  stubBounds(drawn("home-panel"), {
    left: 140,
    top: 120,
    width: 80,
    height: 24,
  });

  drag(canvasSurface(), { from: { x: 60, y: 40 }, to: { x: 260, y: 200 } });

  expect(currentRowNames(tree())).toEqual(["home-panel"]);
});

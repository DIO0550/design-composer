import { fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/canvas/__tests__/canvas-gesture";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { drawn, drawnAt, injectedStyles, renderCanvas } from "./setup";

/**
 * `home` に、2 軸とも固定の `panel`、幅だけ固定の `banner`、
 * モードを指定していない `title`、部品インスタンスの `action` が並ぶ状態。
 */
function setupSelection(
  selectedNames: readonly string[] = [],
): DocumentSelection {
  const designDocument = DesignDocument.create({
    components: { card: { type: "Box", children: [] } },
    artboards: [
      {
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
            name: "banner",
            type: "Box",
            props: { widthMode: "fixed", width: 200 },
            children: [],
          },
          { name: "title", type: "Text", props: { content: "ホーム" } },
          { name: "action", ref: "card" },
        ],
      },
    ],
  });
  return DocumentSelection.fromNames(designDocument, selectedNames);
}

/** 画面の (100, 50) に 200x100 で描かれている、という前提。右辺 x=300 / 下辺 y=150。 */
const PanelBounds: CanvasBounds = {
  left: 100,
  top: 50,
  width: 200,
  height: 100,
};

test("2 軸とも fixed のノードを選ぶとハンドルが描かれる", () => {
  renderCanvas({ selection: setupSelection(["panel"]) });

  expect(injectedStyles()).toContain('[data-name="panel"]::after');
});

test("幅だけが fixed のノードを選んでもハンドルが描かれる", () => {
  /*
   * ハンドルは掴める軸ごとではなく、掴める軸が 1 つでもあれば四隅に出す
   * （UI 案 docs/Design Composer.html の `login-form` は width=fixed / height=hug）。
   */
  renderCanvas({ selection: setupSelection(["banner"]) });

  expect(injectedStyles()).toContain('[data-name="banner"]::after');
});

test("モードを指定していないノードを選んでもハンドルは描かれない", () => {
  renderCanvas({ selection: setupSelection(["title"]) });

  expect(injectedStyles()).not.toContain('[data-name="title"]::after');
});

test("部品インスタンスを選んでもハンドルは描かれない", () => {
  renderCanvas({ selection: setupSelection(["action"]) });

  expect(injectedStyles()).not.toContain('[data-name="action"]::after');
});

test("artboard を選ぶとハンドルが描かれる", () => {
  renderCanvas({ selection: setupSelection(["home"]) });

  expect(injectedStyles()).toContain('[data-name="home"]::after');
});

test("何も選んでいなければハンドルは描かれない", () => {
  renderCanvas({ selection: setupSelection() });

  expect(injectedStyles()).not.toContain("::after");
});

test("右辺を掴んで右へ運ぶと、動かした分だけ幅が伸びた大きさが通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(panel, { x: 338, y: 100 });
  releasePointer(panel, { x: 338, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith({ axis: "width", length: 240 });
});

test("下辺を掴んで下へ運ぶと、動かした分だけ高さが伸びた大きさが通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 200, y: 148 });
  movePointer(panel, { x: 200, y: 178 });
  releasePointer(panel, { x: 200, y: 178 });

  expect(onResize).toHaveBeenLastCalledWith({ axis: "height", length: 130 });
});

test("ハンドルから離れたところを掴んで運んでも大きさは変わらない", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 200, y: 100 });
  movePointer(panel, { x: 240, y: 100 });
  releasePointer(panel, { x: 240, y: 100 });

  expect(onResize).not.toHaveBeenCalled();
});

test("選んでいないノードの辺を掴んでも大きさは変わらない", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["title"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(panel, { x: 338, y: 100 });

  expect(onResize).not.toHaveBeenCalled();
});

test("ハンドルを掴んでいる間はツリー内の移動が起きない", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onMoveNode });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(drawn("title"), { x: 338, y: 100 });
  releasePointer(drawn("title"), { x: 338, y: 100 });

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("大きさを変えた直後のクリックでは選択が変わらない", () => {
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onSelect });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(panel, { x: 338, y: 100 });
  releasePointer(panel, { x: 338, y: 100 });
  fireEvent.click(drawn("title"));

  expect(onSelect).not.toHaveBeenCalled();
});

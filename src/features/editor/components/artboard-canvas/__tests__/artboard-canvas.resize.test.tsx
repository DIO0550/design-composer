import { fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/__tests__/canvas-gesture";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { CanvasBounds } from "@/features/editor/domains/node-drop";
import { Option } from "@/utils/Option";
import { injectedStyles, renderCanvas } from "./setup";

/**
 * `home` に、2 軸とも固定の `panel`、モードを指定していない `title`、
 * 部品インスタンスの `action` が並ぶ状態。
 */
function setupState(selectedName?: string): EditorState {
  const state = EditorState.create(
    DesignDocument.create({
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
            { name: "title", type: "Text", props: { content: "ホーム" } },
            { name: "action", ref: "card" },
          ],
        },
      ],
    }),
  );
  return selectedName === undefined
    ? state
    : EditorState.select(state, selectedName);
}

/** キャンバスに描かれている、名前で指した要素。 */
function drawn(name: string): Element {
  return Option.unwrap(
    Option.fromNullable(document.querySelector(`[data-name="${name}"]`)),
  );
}

/**
 * 描かれた大きさをテスト用の値にする。
 *
 * happy-dom はレイアウトを行わず矩形をすべて 0 で返すため、そのままでは
 * 「どこが掴める帯か」が決まらない。差し替えるのはブラウザが行う測定だけで、
 * 掴めるかどうかと長さの決まり方は実物の `node-resize` が答える
 * （rules/testing.md「プロセス外・制御不能な境界」）。
 */
function drawnAt(name: string, bounds: CanvasBounds): Element {
  const element = drawn(name);
  element.getBoundingClientRect = () =>
    new DOMRect(bounds.left, bounds.top, bounds.width, bounds.height);
  return element;
}

/** 画面の (100, 50) に 200x100 で描かれている、という前提。右辺 x=300 / 下辺 y=150。 */
const PanelBounds: CanvasBounds = {
  left: 100,
  top: 50,
  width: 200,
  height: 100,
};

test("fixed のノードを選ぶと幅と高さのハンドルが描かれる", () => {
  renderCanvas({ state: setupState("panel") });

  expect(injectedStyles()).toContain('[data-name="panel"]::after');
  expect(injectedStyles()).toContain('[data-name="panel"]::before');
});

test("モードを指定していないノードを選んでもハンドルは描かれない", () => {
  renderCanvas({ state: setupState("title") });

  expect(injectedStyles()).not.toContain('[data-name="title"]::after');
});

test("部品インスタンスを選んでもハンドルは描かれない", () => {
  renderCanvas({ state: setupState("action") });

  expect(injectedStyles()).not.toContain('[data-name="action"]::after');
});

test("artboard を選ぶとハンドルが描かれる", () => {
  renderCanvas({ state: setupState("home") });

  expect(injectedStyles()).toContain('[data-name="home"]::after');
});

test("何も選んでいなければハンドルは描かれない", () => {
  renderCanvas({ state: setupState() });

  expect(injectedStyles()).not.toContain("::after");
});

test("右辺を掴んで右へ運ぶと、動かした分だけ幅が伸びた大きさが通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ state: setupState("panel"), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(panel, { x: 338, y: 100 });
  releasePointer(panel, { x: 338, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith({ axis: "width", length: 240 });
});

test("下辺を掴んで下へ運ぶと、動かした分だけ高さが伸びた大きさが通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ state: setupState("panel"), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 200, y: 148 });
  movePointer(panel, { x: 200, y: 178 });
  releasePointer(panel, { x: 200, y: 178 });

  expect(onResize).toHaveBeenLastCalledWith({ axis: "height", length: 130 });
});

test("ハンドルから離れたところを掴んで運んでも大きさは変わらない", () => {
  const onResize = vi.fn();
  renderCanvas({ state: setupState("panel"), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 200, y: 100 });
  movePointer(panel, { x: 240, y: 100 });
  releasePointer(panel, { x: 240, y: 100 });

  expect(onResize).not.toHaveBeenCalled();
});

test("選んでいないノードの辺を掴んでも大きさは変わらない", () => {
  const onResize = vi.fn();
  renderCanvas({ state: setupState("title"), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(panel, { x: 338, y: 100 });

  expect(onResize).not.toHaveBeenCalled();
});

test("ハンドルを掴んでいる間はツリー内の移動が起きない", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ state: setupState("panel"), onMoveNode });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(drawn("title"), { x: 338, y: 100 });
  releasePointer(drawn("title"), { x: 338, y: 100 });

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("大きさを変えた直後のクリックでは選択が変わらない", () => {
  const onSelect = vi.fn();
  renderCanvas({ state: setupState("panel"), onSelect });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(panel, { x: 338, y: 100 });
  releasePointer(panel, { x: 338, y: 100 });
  fireEvent.click(drawn("title"));

  expect(onSelect).not.toHaveBeenCalled();
});

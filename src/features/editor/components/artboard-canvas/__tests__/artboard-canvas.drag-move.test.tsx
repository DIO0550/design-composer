import { fireEvent, render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/__tests__/canvas-gesture";
import { EditorState } from "@/features/editor/domains/editor-state";
import { ArtboardCanvas } from "../index";

/**
 * `home` に Text の `title` と、空の Box `panel` が並ぶ状態。
 * `settings` は別 artboard への移動先。
 */
function setupState(): EditorState {
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
            { name: "title", type: "Text", props: { content: "ホーム" } },
            { name: "panel", type: "Box", children: [] },
          ],
        },
        { name: "settings", width: 360, height: 240, children: [] },
      ],
    }),
  );
}

/** キャンバスに描かれている、名前で指した要素。 */
function drawn(name: string): Element {
  const element = document.querySelector(`[data-name="${name}"]`);
  if (element === null) {
    throw new Error(`"${name}" がキャンバスに描かれていない`);
  }
  return element;
}

/** artboard の並び。キャンバスの中で、名前を持たない場所として使う。 */
function artboardList(): Element {
  const list = document.querySelector("ul");
  if (list === null) {
    throw new Error("artboard の並びが描かれていない");
  }
  return list;
}

/** キャンバスへ差し込まれている規則をすべて連結したもの。 */
function injectedStyles(): string {
  return Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent ?? "")
    .join("");
}

/** ノードを掴んで運び、離すまで。運ぶ距離はクリックと区別が付くだけ取る。 */
function dragNode(from: Element, to: Element): void {
  pressPointer(from, { x: 100, y: 100 });
  movePointer(to, { x: 100, y: 150 });
  releasePointer(to, { x: 100, y: 150 });
}

test("ノードを Box の上へ運んで離すとその Box の子になる", () => {
  const onMoveNode = vi.fn();
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={onMoveNode}
    />,
  );

  dragNode(drawn("title"), drawn("panel"));

  expect(onMoveNode).toHaveBeenCalledWith("title", {
    parentName: "panel",
    index: 0,
  });
});

test("ノードを別の artboard の上へ運んで離すとその artboard の子になる", () => {
  const onMoveNode = vi.fn();
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={onMoveNode}
    />,
  );

  dragNode(drawn("title"), drawn("settings"));

  expect(onMoveNode).toHaveBeenCalledWith("title", {
    parentName: "settings",
    index: 0,
  });
});

test("子を持てない Text の上で離すと、外側の Box の子になる", () => {
  const onMoveNode = vi.fn();
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={onMoveNode}
    />,
  );

  dragNode(drawn("panel"), drawn("title"));

  /*
   * 何番目になるかは描かれた大きさで決まるが、happy-dom は矩形を返さない。
   * ここで確かめるのは「どの Box の子になるか」だけで、index の決まり方は
   * domains/node-drop のテストが持つ（rules/testing.md）。
   */
  expect(onMoveNode).toHaveBeenCalledWith(
    "panel",
    expect.objectContaining({ parentName: "home" }),
  );
});

test("押しただけで運んでいなければ移動は起きない", () => {
  const onMoveNode = vi.fn();
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={onMoveNode}
    />,
  );

  pressPointer(drawn("title"), { x: 100, y: 100 });
  releasePointer(drawn("title"), { x: 100, y: 100 });

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("受け入れ先の上ではドロップ先が線で示される", () => {
  const { queryByTestId } = render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
    />,
  );

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("panel"), { x: 100, y: 150 });

  expect(queryByTestId("drop-marker")).not.toBeNull();
});

test("受け入れ先の上では、その Box が枠で示される", () => {
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
    />,
  );

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("panel"), { x: 100, y: 150 });

  expect(injectedStyles()).toContain('[data-name="panel"]{outline:2px dashed');
});

test("受け入れ先が無い場所ではハイライトが出ない", () => {
  const { queryByTestId } = render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
    />,
  );

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(artboardList(), { x: 100, y: 150 });

  expect(queryByTestId("drop-marker")).toBeNull();
});

test("受け入れ先が無い場所で離しても移動は起きない", () => {
  const onMoveNode = vi.fn();
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={vi.fn()}
      onMoveNode={onMoveNode}
    />,
  );

  dragNode(drawn("title"), artboardList());

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("運んだ直後のクリックでは選択が変わらない", () => {
  const onSelect = vi.fn();
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={onSelect}
      onMoveNode={vi.fn()}
    />,
  );

  dragNode(drawn("title"), drawn("panel"));
  fireEvent.click(drawn("panel"));

  expect(onSelect).not.toHaveBeenCalled();
});

test("ドラッグの外で押したクリックはそのまま選択に使われる", () => {
  const onSelect = vi.fn();
  render(
    <ArtboardCanvas
      state={setupState()}
      onSelect={onSelect}
      onMoveNode={vi.fn()}
    />,
  );

  pressPointer(drawn("title"), { x: 100, y: 100 });
  releasePointer(drawn("title"), { x: 100, y: 100 });
  fireEvent.click(drawn("title"));

  expect(onSelect).toHaveBeenCalledWith(["title", "home"]);
});

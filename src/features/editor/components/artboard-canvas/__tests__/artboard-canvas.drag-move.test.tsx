import { fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/__tests__/canvas-gesture";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { injectedStyles, renderCanvas } from "./setup";

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
  return Option.unwrap(
    Option.fromNullable(document.querySelector(`[data-name="${name}"]`)),
  );
}

/** artboard の並び。キャンバスの中で、名前を持たない場所として使う。 */
function artboardList(): Element {
  return Option.unwrap(Option.fromNullable(document.querySelector("ul")));
}

/** ノードを掴んで運び、離すまで。運ぶ距離はクリックと区別が付くだけ取る。 */
function dragNode(from: Element, to: Element): void {
  pressPointer(from, { x: 100, y: 100 });
  movePointer(to, { x: 100, y: 150 });
  releasePointer(to, { x: 100, y: 150 });
}

test("ノードを Box の上へ運んで離すとその Box の子になる", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ state: setupState(), onMoveNode });

  dragNode(drawn("title"), drawn("panel"));

  expect(onMoveNode).toHaveBeenCalledWith("title", {
    parentName: "panel",
    index: 0,
  });
});

test("ノードを別の artboard の上へ運んで離すとその artboard の子になる", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ state: setupState(), onMoveNode });

  dragNode(drawn("title"), drawn("settings"));

  expect(onMoveNode).toHaveBeenCalledWith("title", {
    parentName: "settings",
    index: 0,
  });
});

test("子を持てない Text の上で離すと、外側の Box の子になる", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ state: setupState(), onMoveNode });

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
  renderCanvas({ state: setupState(), onMoveNode });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  releasePointer(drawn("title"), { x: 100, y: 100 });

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("受け入れ先の上ではドロップ先が線で示される", () => {
  const { queryByTestId } = renderCanvas({ state: setupState() });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("panel"), { x: 100, y: 150 });

  expect(queryByTestId("drop-marker")).not.toBeNull();
});

test("受け入れ先の上では、その Box が枠で示される", () => {
  renderCanvas({ state: setupState() });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("panel"), { x: 100, y: 150 });

  expect(injectedStyles()).toContain('[data-name="panel"]{outline:2px dashed');
});

test("受け入れ先が無い場所ではハイライトが出ない", () => {
  const { queryByTestId } = renderCanvas({ state: setupState() });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(artboardList(), { x: 100, y: 150 });

  expect(queryByTestId("drop-marker")).toBeNull();
});

test("受け入れ先が無い場所で離しても移動は起きない", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ state: setupState(), onMoveNode });

  dragNode(drawn("title"), artboardList());

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("運んだ直後のクリックでは選択が変わらない", () => {
  const onSelect = vi.fn();
  renderCanvas({ state: setupState(), onSelect });

  dragNode(drawn("title"), drawn("panel"));
  fireEvent.click(drawn("panel"));

  expect(onSelect).not.toHaveBeenCalled();
});

test("ドラッグの外で押したクリックはそのまま選択に使われる", () => {
  const onSelect = vi.fn();
  renderCanvas({ state: setupState(), onSelect });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  releasePointer(drawn("title"), { x: 100, y: 100 });
  fireEvent.click(drawn("title"));

  expect(onSelect).toHaveBeenCalledWith(["title", "home"]);
});

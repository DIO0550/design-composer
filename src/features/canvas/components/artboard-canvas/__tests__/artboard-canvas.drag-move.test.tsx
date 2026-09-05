import { fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/canvas/__tests__/canvas-gesture";
import {
  artboardList,
  drawn,
  injectedStyles,
  renderCanvas,
  selectionFromArtboards,
} from "./setup";

/**
 * `home` に Text の `title` と、空の Box `panel` が並ぶ、未選択の対。
 * `settings` は別 artboard への移動先。
 */
function setupSelection(): DocumentSelection {
  return selectionFromArtboards(
    [
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
    [],
  );
}

/** ノードを掴んで運び、離すまで。運ぶ距離はクリックと区別が付くだけ取る。 */
function dragNode(from: Element, to: Element): void {
  pressPointer(from, { x: 100, y: 100 });
  movePointer(to, { x: 100, y: 150 });
  releasePointer(to, { x: 100, y: 150 });
}

test("ノードを Box の上へ運んで離すとその Box の子になる", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });

  dragNode(drawn("title"), drawn("panel"));

  expect(onMoveNode).toHaveBeenCalledWith("title", {
    parentName: "panel",
    index: 0,
  });
});

test("ノードを別の artboard の上へ運んで離すとその artboard の子になる", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });

  dragNode(drawn("title"), drawn("settings"));

  expect(onMoveNode).toHaveBeenCalledWith("title", {
    parentName: "settings",
    index: 0,
  });
});

test("子を持てない Text の上で離すと、外側の Box の子になる", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });

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
  renderCanvas({ selection: setupSelection(), onMoveNode });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  releasePointer(drawn("title"), { x: 100, y: 100 });

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("受け入れ先の上ではドロップ先が線で示される", () => {
  const { queryByTestId } = renderCanvas({ selection: setupSelection() });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("panel"), { x: 100, y: 150 });

  expect(queryByTestId("drop-marker")).not.toBeNull();
});

test("受け入れ先の上では、その Box が枠で示される", () => {
  renderCanvas({ selection: setupSelection() });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("panel"), { x: 100, y: 150 });

  expect(injectedStyles()).toContain('[data-name="panel"]{outline:2px dashed');
});

test("受け入れ先が無い場所ではハイライトが出ない", () => {
  const { queryByTestId } = renderCanvas({ selection: setupSelection() });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(artboardList(), { x: 100, y: 150 });

  expect(queryByTestId("drop-marker")).toBeNull();
});

test("受け入れ先が無い場所で離しても移動は起きない", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });

  dragNode(drawn("title"), artboardList());

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("運んだ直後のクリックでは選択が変わらない", () => {
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSelection(), onSelect });

  dragNode(drawn("title"), drawn("panel"));
  fireEvent.click(drawn("panel"));

  expect(onSelect).not.toHaveBeenCalled();
});

test("ドラッグの外で押したクリックはそのまま選択に使われる", () => {
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSelection(), onSelect });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  releasePointer(drawn("title"), { x: 100, y: 100 });
  fireEvent.click(drawn("title"));

  expect(onSelect).toHaveBeenCalledWith(["title", "home"]);
});

import { expect, test, vi } from "vitest";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
  pressPointerHolding,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  drawn,
  renderCanvas,
  selectingOnly,
  selectionFromArtboards,
} from "./setup";

/*
 * ドラッグで掴むノードの階層（docs/06-ui.md「キャンバス直接操作」の移動）。掴むのは同じ押し
 * 方のクリックが選ぶもので、入れ子の中身を押しても、選んでいなければ外側の artboard 直下
 * の子を運ぶ。
 */

/**
 * `home` に Box の `card`、その中に Box の `row`、その中に Text の `label` があり、隣に空の
 * Box `panel` が並ぶ、未選択の対。どれも `flow` なので、運んで離すとツリー内の移動になる。
 *
 * 3 段にするのは、「artboard 直下の子」「選んでいるもの」「いちばん内側」がすべて別の名前
 * になるようにするため（2 段だと選んだものといちばん内側が同じになり、どちらを掴んでも通る）。
 */
function setupSelection(): DocumentSelection {
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "card",
            type: "Box",
            children: [
              {
                name: "row",
                type: "Box",
                children: [
                  { name: "label", type: "Text", props: { content: "札" } },
                ],
              },
            ],
          },
          { name: "panel", type: "Box", children: [] },
        ],
      },
    ],
    [],
  );
}

/** 掴んだあと、`to` の上まで運んで離す。 */
function carryOnto(to: Element): void {
  movePointer(to, { x: 100, y: 150 });
  releasePointer(to, { x: 100, y: 150 });
}

test("選んでいない入れ子の中身を押して運ぶと、artboard 直下の子が動く", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });

  pressPointer(drawn("label"), { x: 100, y: 100 });
  carryOnto(drawn("panel"));

  expect(onMoveNode).toHaveBeenCalledWith("card", {
    parentName: "panel",
    index: 0,
  });
});

test("選んでいるノードの内側を押して運ぶと、選んでいるそのノードが動く", () => {
  const onMoveNode = vi.fn();
  renderCanvas({
    selection: selectingOnly(setupSelection(), "row"),
    onMoveNode,
  });

  pressPointer(drawn("label"), { x: 100, y: 100 });
  carryOnto(drawn("panel"));

  expect(onMoveNode).toHaveBeenCalledWith("row", {
    parentName: "panel",
    index: 0,
  });
});

test("⌘ を押しながら掴むと、選択に関わらず押した位置のいちばん内側が動く", () => {
  const onMoveNode = vi.fn();
  renderCanvas({
    selection: selectingOnly(setupSelection(), "row"),
    onMoveNode,
  });

  pressPointerHolding(drawn("label"), { x: 100, y: 100 }, "meta");
  carryOnto(drawn("panel"));

  expect(onMoveNode).toHaveBeenCalledWith("label", {
    parentName: "panel",
    index: 0,
  });
});

test("Ctrl を押しながら掴んでも、押した位置のいちばん内側が動く", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });

  pressPointerHolding(drawn("label"), { x: 100, y: 100 }, "ctrl");
  carryOnto(drawn("panel"));

  expect(onMoveNode).toHaveBeenCalledWith("label", {
    parentName: "panel",
    index: 0,
  });
});

test("外側の子を自分の内側の Box の上で離すと、自分の中へは入らず外側の親へ落ちる", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });

  // 掴むのは `card`。離す位置の `row` は運んでいるものの子孫なので落とし先にならない
  pressPointer(drawn("label"), { x: 100, y: 100 });
  carryOnto(drawn("row"));

  /*
   * 何番目になるかは描かれた大きさで決まるが、happy-dom は矩形を返さない。ここで確かめ
   * るのは「どの親へ落ちるか」だけ。
   */
  expect(onMoveNode).toHaveBeenCalledWith(
    "card",
    expect.objectContaining({ parentName: "home" }),
  );
});

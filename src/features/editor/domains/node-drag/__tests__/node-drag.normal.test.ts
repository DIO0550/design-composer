import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import type { DropTarget } from "@/features/editor/domains/node-drop";
import { Option } from "@/utils/Option";
import { NodeDrag } from "../index";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          { name: "body", type: "Box", children: [] },
        ],
      },
    ],
  });
}

const SampleDropTarget: DropTarget = {
  position: { parentName: "body", index: 0 },
  marker: { left: 0, top: 0, width: 100, height: 2 },
};

test("押した位置から少ししか動かないうちはドラッグとして扱われない", () => {
  const held = NodeDrag.grab("title", { x: 100, y: 100 });

  const moved = NodeDrag.moveTo(held, { x: 102, y: 100 }, Option.none);

  expect(NodeDrag.isDragging(moved)).toBe(false);
});

test("押した位置から離れるとドラッグとして扱われる", () => {
  const held = NodeDrag.grab("title", { x: 100, y: 100 });

  const moved = NodeDrag.moveTo(held, { x: 100, y: 140 }, Option.none);

  expect(NodeDrag.isDragging(moved)).toBe(true);
});

test("ドラッグ中は受け入れ先の上にいる間だけ落ちる位置が決まる", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab("title", { x: 100, y: 100 }),
    { x: 100, y: 140 },
    Option.some(SampleDropTarget),
  );

  expect(Option.unwrap(NodeDrag.dropTarget(dragging)).position).toEqual({
    parentName: "body",
    index: 0,
  });
});

test("受け入れられない場所へ移ると落ちる位置は無くなる", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab("title", { x: 100, y: 100 }),
    { x: 100, y: 140 },
    Option.some(SampleDropTarget),
  );

  const outside = NodeDrag.moveTo(dragging, { x: 100, y: 180 }, Option.none);

  expect(NodeDrag.dropTarget(outside).some).toBe(false);
});

test("掴んでいないときのポインタ移動では何も起きない", () => {
  const moved = NodeDrag.moveTo(
    NodeDrag.create(),
    { x: 100, y: 140 },
    Option.some(SampleDropTarget),
  );

  expect(NodeDrag.isDragging(moved)).toBe(false);
});

test("動かさずに離したときは直後のクリックを選択に使う", () => {
  const released = NodeDrag.release(NodeDrag.grab("title", { x: 100, y: 100 }));

  expect(NodeDrag.consumesClick(released)).toBe(false);
});

test("運んでから離したときは直後のクリックを選択に使わない", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab("title", { x: 100, y: 100 }),
    { x: 100, y: 140 },
    Option.some(SampleDropTarget),
  );

  expect(NodeDrag.consumesClick(NodeDrag.release(dragging))).toBe(true);
});

test("離したあとは何も掴んでいない状態に戻る", () => {
  const dragging = NodeDrag.moveTo(
    NodeDrag.grab("title", { x: 100, y: 100 }),
    { x: 100, y: 140 },
    Option.some(SampleDropTarget),
  );

  expect(NodeDrag.heldName(NodeDrag.release(dragging)).some).toBe(false);
});

test("押された位置から外へ辿った名前のうち最も内側のノードを掴む", () => {
  const name = NodeDrag.grabbableName(setupDocument(), ["title", "home"]);

  expect(Option.unwrap(name)).toBe("title");
});

test("artboard の枠だけを押したときは掴めるノードが無い", () => {
  const name = NodeDrag.grabbableName(setupDocument(), ["home"]);

  expect(name.some).toBe(false);
});

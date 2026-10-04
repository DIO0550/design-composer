import { expect, test } from "vitest";
import {
  canvasContent,
  drawn,
} from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  leavePointer,
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  BoxTemplate,
  dragTitleOntoCard,
  drawnCardColumn,
  paletteBox,
  renderHarness,
} from "./setup";

test("フローのノードを Box の上へ運んで離すと、ポインタが中点を越えた子の数の位置への移動が届く", () => {
  const { onMove } = renderHarness();
  drawnCardColumn();

  dragTitleOntoCard();

  expect(onMove.mock.calls).toEqual([
    ["title", { parentName: "card", index: 1 }],
  ]);
});

test("パレットの雛形を Box の上へ運んで離すと、その位置への挿入が届く", () => {
  const { onInsertAt } = renderHarness();
  drawnCardColumn();

  pressPointer(paletteBox(), { x: 100, y: 100 });
  movePointer(drawn("card"), { x: 50, y: 200 });
  releasePointer(drawn("card"), { x: 50, y: 200 });

  expect(onInsertAt.mock.calls).toEqual([
    [BoxTemplate, { parentName: "card", index: 1 }],
  ]);
});

test("落とせる親が無い場所で離すと移動は届かない", () => {
  const { onMove } = renderHarness();
  drawnCardColumn();

  pressPointer(drawn("title"), { x: 20, y: 235 });
  movePointer(canvasContent(), { x: 50, y: 200 });
  releasePointer(canvasContent(), { x: 50, y: 200 });

  expect(onMove).not.toHaveBeenCalled();
});

test("運んでいる途中でキャンバスの外へ出ると、離しても移動は届かない", () => {
  const { onMove } = renderHarness();
  drawnCardColumn();

  pressPointer(drawn("title"), { x: 20, y: 235 });
  movePointer(drawn("card"), { x: 50, y: 200 });
  leavePointer(canvasContent());
  releasePointer(drawn("card"), { x: 50, y: 200 });

  expect(onMove).not.toHaveBeenCalled();
});

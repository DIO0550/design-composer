import { fireEvent } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { harnessOutput } from "@/components/__tests__/harness-output";
import { canvasSurface } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  PointerId,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { clearDrawn } from "@/features/editor/features/canvas/__tests__/canvas-measure";
import { PointerButtons } from "@/libs/dom-event";
import { artboardFrame, drawHomeChildren, renderHarness } from "./setup";

afterEach(clearDrawn);

test("押して閾値を越えて引くと、引いた 2 点を対角にした範囲が出る", () => {
  renderHarness();

  pressPointer(artboardFrame(), { x: 200, y: 160 });
  movePointer(canvasSurface(), { x: 90, y: 90 });

  expect(harnessOutput("range-bounds")).toBe("90,90,110,70");
});

test("押しただけでは範囲を出さない", () => {
  renderHarness();

  pressPointer(artboardFrame(), { x: 200, y: 160 });

  expect(harnessOutput("range-bounds")).toBe("引いていない");
});

test("主ボタン以外で押して引いても範囲を出さない", () => {
  renderHarness();

  pressPointer(artboardFrame(), { x: 200, y: 160 }, PointerButtons.Middle);
  movePointer(canvasSurface(), { x: 90, y: 90 });

  expect(harnessOutput("range-bounds")).toBe("引いていない");
});

test("離すと範囲が消える", () => {
  renderHarness();

  pressPointer(artboardFrame(), { x: 200, y: 160 });
  movePointer(canvasSurface(), { x: 90, y: 90 });
  releasePointer(canvasSurface(), { x: 90, y: 90 });

  expect(harnessOutput("range-bounds")).toBe("引いていない");
});

test("引いている途中で捕捉が外れると、範囲が消える", () => {
  renderHarness();

  pressPointer(artboardFrame(), { x: 200, y: 160 });
  movePointer(canvasSurface(), { x: 90, y: 90 });
  fireEvent.lostPointerCapture(canvasSurface());

  expect(harnessOutput("range-bounds")).toBe("引いていない");
});

test("引いている間、範囲に重なったものが離す前から選ばれる", () => {
  drawHomeChildren();
  const { onSelect } = renderHarness();

  pressPointer(artboardFrame(), { x: 200, y: 160 });
  movePointer(canvasSurface(), { x: 90, y: 90 });

  expect(onSelect.mock.lastCall).toEqual([["card"]]);
});

test("閾値を越えるまでは、動かしても選択に手を付けない", () => {
  drawHomeChildren();
  const { onSelect } = renderHarness();

  pressPointer(artboardFrame(), { x: 200, y: 160 });
  movePointer(canvasSurface(), { x: 198, y: 159 });

  expect(onSelect).not.toHaveBeenCalled();
});

test("範囲が孫まで覆っても、選ばれるのは artboard 直下の子だけ", () => {
  drawHomeChildren();
  const { onSelect } = renderHarness();

  pressPointer(artboardFrame(), { x: 200, y: 160 });
  movePointer(canvasSurface(), { x: 105, y: 105 });

  expect(onSelect.mock.lastCall).toEqual([["card"]]);
});

test("最後に動かした位置と離した位置が違えば、離した位置で選び直す", () => {
  drawHomeChildren();
  const { onSelect } = renderHarness();

  pressPointer(artboardFrame(), { x: 90, y: 90 });
  movePointer(canvasSurface(), { x: 200, y: 160 });
  releasePointer(canvasSurface(), { x: 400, y: 160 });

  expect(onSelect.mock.lastCall).toEqual([["card", "title"]]);
});

test("押して離すだけなら選択に手を付けない", () => {
  drawHomeChildren();
  const { onSelect } = renderHarness();

  pressPointer(artboardFrame(), { x: 200, y: 160 });
  releasePointer(canvasSurface(), { x: 201, y: 161 });

  expect(onSelect).not.toHaveBeenCalled();
});

test("引き始めていないときに離しても選択に手を付けない", () => {
  drawHomeChildren();
  const { onSelect } = renderHarness();

  releasePointer(canvasSurface(), { x: 90, y: 90 });

  expect(onSelect).not.toHaveBeenCalled();
});

test("押すと、土台ではなく押した要素がポインタを捕捉する", () => {
  renderHarness();

  pressPointer(artboardFrame(), { x: 200, y: 160 });

  expect(artboardFrame().hasPointerCapture(PointerId)).toBe(true);
});

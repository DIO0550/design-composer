import { afterEach, expect, test } from "vitest";
import { harnessOutput } from "@/components/__tests__/harness-output";
import { canvasContent } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  clearDrawn,
  drawNamed,
} from "@/features/editor/features/canvas/__tests__/canvas-measure";
import { renderHarness, settingsHandle } from "./setup";

afterEach(clearDrawn);

/** `home` の右辺は x=360、`settings` の左辺は x=400（掴んだ時点の位置と同じ）。 */
function drawSideBySide(): void {
  drawNamed("home", { left: 0, top: 0, width: 360, height: 240 });
  drawNamed("settings", { left: 400, top: 0, width: 360, height: 240 });
}

test("他の artboard の辺の近くまで運ぶと、その辺に揃う位置へ寄る", () => {
  drawSideBySide();
  renderHarness();

  // 左辺を x=363 まで運ぶと、home の右辺 x=360 との差 3px が閾値の内側に入る
  pressPointer(settingsHandle(), { x: 500, y: 100 });
  movePointer(canvasContent(), { x: 463, y: 100 });

  expect(harnessOutput("preview")).toBe("settings 360,0");
});

test("運んでいる artboard 自身の辺へは寄らない", () => {
  drawSideBySide();
  renderHarness();

  // 掴んだ時点の自分の左辺 x=400 からは 5px で閾値の内側だが、そこへ戻されない
  pressPointer(settingsHandle(), { x: 500, y: 100 });
  movePointer(canvasContent(), { x: 505, y: 100 });

  expect(harnessOutput("preview")).toBe("settings 405,0");
});

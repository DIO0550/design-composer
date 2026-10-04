import { expect, test } from "vitest";
import { canvasContent } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  PointerId,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { harnessOutput } from "@/features/editor/features/canvas/__tests__/harness-output";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { dragSettings, renderHarness, settingsHandle } from "./setup";

test("掴んで動かすと、掴んだ時点の位置に動かした量を足した位置が運び先になる", () => {
  renderHarness();

  pressPointer(settingsHandle(), { x: 500, y: 100 });
  movePointer(canvasContent(), { x: 530, y: 88 });

  expect(harnessOutput("preview")).toBe("settings 430,-12");
});

test("倍率を上げると、運んだ量はドキュメント上の px に割り戻される", () => {
  renderHarness({ ...CanvasView.create(), scale: 2 });

  pressPointer(settingsHandle(), { x: 500, y: 100 });
  movePointer(canvasContent(), { x: 530, y: 88 });

  expect(harnessOutput("preview")).toBe("settings 415,-6");
});

test("運んで離すと、運び先の位置で置き直しが届く", () => {
  const { onReposition } = renderHarness();

  dragSettings();

  expect(onReposition.mock.calls).toEqual([["settings", { x: 430, y: -12 }]]);
});

test("動かさずに離すと置き直しは届かない", () => {
  const { onReposition } = renderHarness();

  pressPointer(settingsHandle(), { x: 500, y: 100 });
  releasePointer(canvasContent(), { x: 500, y: 100 });

  expect(onReposition).not.toHaveBeenCalled();
});

test("離したあとは運び先を出さない", () => {
  renderHarness();

  dragSettings();

  expect(harnessOutput("preview")).toBe("運んでいない");
});

test("見出しを掴むと、掴んだ見出しがポインタを捕捉する", () => {
  renderHarness();

  pressPointer(settingsHandle(), { x: 500, y: 100 });

  expect(settingsHandle().hasPointerCapture(PointerId)).toBe(true);
});

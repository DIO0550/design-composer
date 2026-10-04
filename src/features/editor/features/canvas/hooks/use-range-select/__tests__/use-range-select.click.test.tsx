import { fireEvent } from "@testing-library/react";
import { expect, test } from "vitest";
import { canvasSurface } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { harnessOutput } from "@/features/editor/features/canvas/__tests__/harness-output";
import { artboardFrame, drawRange, frameNode, renderHarness } from "./setup";

test("範囲を引いて離した直後の click は、中身へ届かない", () => {
  renderHarness();

  drawRange();
  fireEvent.click(artboardFrame());

  expect(harnessOutput("clicked")).toBe("click は届いていない");
});

test("範囲を引いていないときの click は、そのまま中身へ届く", () => {
  renderHarness();

  fireEvent.click(artboardFrame());

  expect(harnessOutput("clicked")).toBe("届いた");
});

test("直後の click を飲み込んだあとは、次の click が中身へ届く", () => {
  renderHarness();

  drawRange();
  fireEvent.click(artboardFrame());
  fireEvent.click(artboardFrame());

  expect(harnessOutput("clicked")).toBe("届いた");
});

test("範囲を引いて離したあと click が来ないまま中身を押すと、その click は中身へ届く", () => {
  renderHarness();

  drawRange();
  pressPointer(frameNode(), { x: 120, y: 120 });
  releasePointer(frameNode(), { x: 120, y: 120 });
  fireEvent.click(frameNode());

  expect(harnessOutput("clicked")).toBe("届いた");
});

test("範囲を引いて離したあとに捕捉が外れても、直後の click は中身へ届かない", () => {
  renderHarness();

  drawRange();
  fireEvent.lostPointerCapture(canvasSurface());
  fireEvent.click(artboardFrame());

  expect(harnessOutput("clicked")).toBe("click は届いていない");
});

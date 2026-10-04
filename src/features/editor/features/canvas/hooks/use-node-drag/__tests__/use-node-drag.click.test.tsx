import { fireEvent } from "@testing-library/react";
import { expect, test } from "vitest";
import { drawn } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { harnessOutput } from "@/features/editor/features/canvas/__tests__/harness-output";
import { dragTitleOntoCard, drawnCardColumn, renderHarness } from "./setup";

test("既存のノードを運んで離した直後の click は、選択に使われない", () => {
  renderHarness();
  drawnCardColumn();

  dragTitleOntoCard();
  fireEvent.click(drawn("card"));

  expect(harnessOutput("clicked")).toBe("click は届いていない");
});

test("運ばずに離したときの click は、そのまま選択に使われる", () => {
  renderHarness();

  pressPointer(drawn("title"), { x: 20, y: 235 });
  releasePointer(drawn("title"), { x: 20, y: 235 });
  fireEvent.click(drawn("title"));

  expect(harnessOutput("clicked")).toBe("選択に使う");
});

test("運んだ直後の click を飲み込んだあとは、次の click が選択に使われる", () => {
  renderHarness();
  drawnCardColumn();

  dragTitleOntoCard();
  fireEvent.click(drawn("card"));
  fireEvent.click(drawn("card"));

  expect(harnessOutput("clicked")).toBe("選択に使う");
});

import { fireEvent } from "@testing-library/react";
import { expect, test } from "vitest";
import { harnessOutput } from "@/components/__tests__/harness-output";
import { drawn } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { drawCardColumn, renderHarness } from "./setup";

/** `title` を掴んで `card` の上まで運び、そこで離す。 */
function dragTitleOntoCard(): void {
  pressPointer(drawn("title"), { x: 20, y: 235 });
  movePointer(drawn("card"), { x: 50, y: 200 });
  releasePointer(drawn("card"), { x: 50, y: 200 });
}

test("既存のノードを運んで離した直後の click は、選択に使われない", () => {
  renderHarness();
  drawCardColumn();

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
  drawCardColumn();

  dragTitleOntoCard();
  fireEvent.click(drawn("card"));
  fireEvent.click(drawn("card"));

  expect(harnessOutput("clicked")).toBe("選択に使う");
});

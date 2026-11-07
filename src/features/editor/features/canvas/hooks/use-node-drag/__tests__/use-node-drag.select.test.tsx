import { expect, test } from "vitest";
import { drawn } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import { pressPointer } from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { harnessOutput } from "@/features/editor/features/canvas/__tests__/harness-output";
import { paletteBox, renderHarness } from "./setup";

test("選んでいないノードを押すと、掴んだそのノードが選ばれる", () => {
  renderHarness();

  pressPointer(drawn("title"), { x: 20, y: 235 });

  expect(harnessOutput("selected")).toBe("title");
});

test("入れ子の中身を押すと、選ばれるのは掴んだ artboard 直下の子", () => {
  renderHarness();

  pressPointer(drawn("label"), { x: 20, y: 135 });

  expect(harnessOutput("selected")).toBe("card");
});

test("artboard の背景を押しても何も選ばれない", () => {
  renderHarness();

  pressPointer(drawn("home"), { x: 300, y: 20 });

  expect(harnessOutput("selected")).toBe("選んでいない");
});

test("パレットの雛形を掴んでも何も選ばれない", () => {
  renderHarness();

  pressPointer(paletteBox(), { x: 100, y: 100 });

  expect(harnessOutput("selected")).toBe("選んでいない");
});

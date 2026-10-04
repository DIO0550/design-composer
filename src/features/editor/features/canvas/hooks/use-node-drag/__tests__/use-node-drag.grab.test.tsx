import { expect, test } from "vitest";
import { drawn } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { harnessOutput } from "@/features/editor/features/canvas/__tests__/harness-output";
import { paletteBox, renderHarness } from "./setup";

test("選べるノードを押すと掴む", () => {
  renderHarness();

  pressPointer(drawn("title"), { x: 20, y: 235 });

  expect(harnessOutput("grabbed")).toBe("掴んだ");
});

test("artboard の背景を押しても掴まない", () => {
  renderHarness();

  pressPointer(drawn("home"), { x: 300, y: 20 });

  expect(harnessOutput("grabbed")).toBe("掴んでいない");
});

test("パレットの雛形を掴んで運んでいる間、運んでいる雛形が分かる", () => {
  renderHarness();

  pressPointer(paletteBox(), { x: 100, y: 100 });
  movePointer(drawn("card"), { x: 50, y: 200 });

  expect(harnessOutput("carried-template")).toBe("box");
});

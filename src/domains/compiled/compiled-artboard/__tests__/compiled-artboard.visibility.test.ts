import { expect, test } from "vitest";
import { CompiledArtboard } from "../index";
import { setupCompiledArtboard } from "./compiled-artboard-setup";

test("非表示を書いた artboard は、キャンバスに描かない artboard になる", () => {
  expect(
    CompiledArtboard.isVisible(setupCompiledArtboard({ visibility: "hidden" })),
  ).toBe(false);
});

test("表示 / 非表示を書いていない artboard は、キャンバスに描く artboard になる", () => {
  expect(CompiledArtboard.isVisible(setupCompiledArtboard({}))).toBe(true);
});

test("非表示を書いた artboard の中身は、出力でも描かれない", () => {
  expect(
    setupCompiledArtboard({ visibility: "hidden" }).element.style.display,
  ).toBe("none");
});

test("表示 / 非表示を書いていない artboard の中身は、出力で隠されない", () => {
  // 既定の layout は column なので flex コンテナになる（none 以外の答えになる入力）
  expect(setupCompiledArtboard({}).element.style.display).toBe("flex");
});

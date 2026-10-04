import { expect, test } from "vitest";
import { DefaultTokenRefs } from "@/domains/__tests__/token-refs";
import { Artboard } from "@/domains/dcmp/artboard";
import type { Props } from "@/domains/dcmp/node";
import { CompiledArtboard } from "../index";

function compile(props: Props): CompiledArtboard {
  return CompiledArtboard.fromArtboard(
    Artboard.create({ name: "home", width: 360, height: 240, props }),
    [],
    DefaultTokenRefs,
  );
}

test("非表示を書いた artboard は、キャンバスに描かない artboard になる", () => {
  expect(CompiledArtboard.isVisible(compile({ visibility: "hidden" }))).toBe(
    false,
  );
});

test("表示 / 非表示を書いていない artboard は、キャンバスに描く artboard になる", () => {
  expect(CompiledArtboard.isVisible(compile({}))).toBe(true);
});

test("非表示を書いた artboard の中身は、出力でも描かれない", () => {
  expect(compile({ visibility: "hidden" }).element.style.display).toBe("none");
});

test("表示 / 非表示を書いていない artboard の中身は、出力で隠されない", () => {
  // 既定の layout は column なので flex コンテナになる（none 以外の答えになる入力）
  expect(compile({}).element.style.display).toBe("flex");
});

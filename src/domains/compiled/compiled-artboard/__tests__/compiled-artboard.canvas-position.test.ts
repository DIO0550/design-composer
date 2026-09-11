import { expect, test } from "vitest";
import { TokenRefSpelling } from "@/domains/__tests__/token-refs";
import { Artboard } from "@/domains/dcmp/artboard";
import { CompiledArtboard } from "../index";

test("コンパイル結果のキャンバス上の位置は、宣言元の artboard から取られる", () => {
  // x と y を別の値にする（取り違えても同じ答えになる入力を避ける）
  const artboard = Artboard.create({
    name: "home",
    width: 360,
    height: 240,
    canvasPosition: { x: 900, y: 300 },
  });

  const compiled = CompiledArtboard.fromArtboard(
    artboard,
    [],
    TokenRefSpelling,
  );

  expect(compiled.canvasPosition).toEqual({ x: 900, y: 300 });
});

test("キャンバス上の位置を持たない artboard は、コンパイル結果も位置を持たない", () => {
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });

  const compiled = CompiledArtboard.fromArtboard(
    artboard,
    [],
    TokenRefSpelling,
  );

  expect(compiled.canvasPosition).toBeUndefined();
});

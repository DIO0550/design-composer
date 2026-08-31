import { expect, test } from "vitest";
import { Artboard } from "@/domains/dcmp/artboard";
import type { TokenRefs } from "@/domains/dcmp/css-declaration";
import { CompiledArtboard } from "../index";

/** カスタムプロパティ名の綴り方は出力層の知識なので、テストからも引数で渡す。 */
const tokenRefs = {
  ref: (kind, name) => `var(--${kind}-${name})`,
  typographyRef: (name, property) => `var(--typography-${name}-${property})`,
} satisfies TokenRefs;

test("コンパイル結果のキャンバス上の位置は、宣言元の artboard から取られる", () => {
  // x と y を別の値にする（取り違えても同じ答えになる入力を避ける）
  const artboard = Artboard.create({
    name: "home",
    width: 360,
    height: 240,
    canvasPosition: { x: 900, y: 300 },
  });

  const compiled = CompiledArtboard.fromArtboard(artboard, [], tokenRefs);

  expect(compiled.canvasPosition).toEqual({ x: 900, y: 300 });
});

test("キャンバス上の位置を持たない artboard は、コンパイル結果も位置を持たない", () => {
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });

  const compiled = CompiledArtboard.fromArtboard(artboard, [], tokenRefs);

  expect(compiled.canvasPosition).toBeUndefined();
});

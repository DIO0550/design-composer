import { expect, test } from "vitest";
import { TextElement } from "@/domains/compiled-element";
import { Artboard } from "@/domains/dcmp/artboard";
import type { TokenRefs } from "@/domains/dcmp/css-declaration";
import { CompiledArtboard } from "../index";

/** カスタムプロパティ名の綴り方は出力層の知識なので、テストからも引数で渡す。 */
const tokenRefs = {
  ref: (kind, name) => `var(--${kind}-${name})`,
  typographyRef: (name, property) => `var(--typography-${name}-${property})`,
} satisfies TokenRefs;

test("コンパイル結果の大きさは、宣言元の artboard から取られる", () => {
  // 幅と高さを別の値にする（取り違えても同じ答えになる入力を避ける）
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });

  const compiled = CompiledArtboard.fromArtboard(artboard, [], tokenRefs);

  expect([compiled.width, compiled.height]).toStrictEqual([360, 240]);
});

test("コンパイル結果の中身は、宣言元の artboard の props から組み立てられる", () => {
  const artboard = Artboard.create({
    name: "home",
    width: 360,
    height: 240,
    props: { direction: "row", background: "primary" },
  });

  const compiled = CompiledArtboard.fromArtboard(artboard, [], tokenRefs);

  expect(compiled.element.style).toMatchObject({
    "flex-direction": "row",
    background: "var(--colors-primary)",
    width: "360px",
  });
});

test("コンパイル結果の中身は、渡された子をそのまま並べる", () => {
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });
  const child = TextElement.create("home-title", [], "ようこそ");

  const compiled = CompiledArtboard.fromArtboard(artboard, [child], tokenRefs);

  expect(compiled.element.children).toStrictEqual([child]);
});

import { expect, test } from "vitest";
import { TokenRefSpelling } from "@/domains/__tests__/token-refs";
import { TextElement } from "@/domains/compiled/compiled-element";
import { Artboard } from "@/domains/dcmp/artboard";
import { CompiledArtboard } from "../index";

test("コンパイル結果の大きさは、宣言元の artboard から取られる", () => {
  // 幅と高さを別の値にする（取り違えても同じ答えになる入力を避ける）
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });

  const compiled = CompiledArtboard.fromArtboard(
    artboard,
    [],
    TokenRefSpelling,
  );

  expect([compiled.width, compiled.height]).toStrictEqual([360, 240]);
});

test("コンパイル結果の中身は、宣言元の artboard の props から組み立てられる", () => {
  const artboard = Artboard.create({
    name: "home",
    width: 360,
    height: 240,
    props: { layout: "row", background: "primary" },
  });

  const compiled = CompiledArtboard.fromArtboard(
    artboard,
    [],
    TokenRefSpelling,
  );

  expect(compiled.element.style).toMatchObject({
    "flex-direction": "row",
    background: "var(--colors-primary)",
    width: "360px",
  });
});

test("props で絶対配置を指定した artboard も、子が位置を測る基準のままになる", () => {
  const artboard = Artboard.create({
    name: "home",
    width: 360,
    height: 240,
    props: { placement: "absolute", x: 40, y: 24 },
  });

  const compiled = CompiledArtboard.fromArtboard(
    artboard,
    [],
    TokenRefSpelling,
  );

  expect(compiled.element.style.position).toBe("relative");
});

test("コンパイル結果の中身は、渡された子をそのまま並べる", () => {
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });
  const child = TextElement.create("home-title", [], "ようこそ");

  const compiled = CompiledArtboard.fromArtboard(
    artboard,
    [child],
    TokenRefSpelling,
  );

  expect(compiled.element.children).toStrictEqual([child]);
});

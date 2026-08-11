import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import { BoxElement } from "@/domains/compiled-element";
import { CompiledArtboard } from "../index";

test("コンパイル結果の大きさは、宣言元の artboard から取られる", () => {
  // 幅と高さを別の値にする（取り違えても同じ答えになる入力を避ける）
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });
  const element = BoxElement.create("home", [], []);

  const compiled = CompiledArtboard.fromArtboard(artboard, element);

  expect([compiled.width, compiled.height]).toStrictEqual([360, 240]);
});

test("コンパイル結果は、渡された中身をそのまま持つ", () => {
  const artboard = Artboard.create({ name: "home", width: 360, height: 240 });
  const element = BoxElement.create("home", [], []);

  const compiled = CompiledArtboard.fromArtboard(artboard, element);

  expect(compiled.element).toBe(element);
});

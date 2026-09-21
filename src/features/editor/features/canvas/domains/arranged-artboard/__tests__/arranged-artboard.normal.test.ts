import { expect, test } from "vitest";
import type { CompiledArtboard } from "@/domains/compiled/compiled-artboard";
import type { Offset } from "@/domains/unit/offset";
import { ArrangedArtboard } from "../index";
import { compiledArtboard } from "./setup";

/**
 * 置き場所だけを取り出す。
 *
 * @param artboards 置き場所を決める対象
 * @returns 入力と同じ並び順の座標
 */
function positionsOf(
  artboards: readonly CompiledArtboard[],
): readonly Offset[] {
  return ArrangedArtboard.fromArtboards(artboards).map(
    ({ canvasPosition }) => canvasPosition,
  );
}

test("ファイルに書かれた位置を持つ artboard は、その位置へ置かれる", () => {
  // 自動配置では絶対に来ない座標にする（無視する実装で通らないようにする）
  const positions = positionsOf([
    compiledArtboard("home", { width: 200, height: 100 }, { x: 900, y: 300 }),
    compiledArtboard("empty", { width: 200, height: 100 }),
  ]);

  expect(positions[0]).toEqual({ x: 900, y: 300 });
});

test("位置を持たない artboard は、直前までの自動配置の右隣へ置かれる", () => {
  const positions = positionsOf([
    compiledArtboard("home", { width: 200, height: 100 }),
    compiledArtboard("empty", { width: 200, height: 100 }),
  ]);

  // 200（1 枚目の幅）+ 32（間隔）
  expect(positions[1]).toEqual({ x: 232, y: 0 });
});

test("既定の位置は配列順と幅で決まり、前の artboard が座標を持っても変わらない", () => {
  const withPlaced = positionsOf([
    compiledArtboard("home", { width: 200, height: 100 }),
    compiledArtboard("moved", { width: 500, height: 100 }, { x: 900, y: 300 }),
    compiledArtboard("empty", { width: 200, height: 100 }),
  ]);
  const withoutPlaced = positionsOf([
    compiledArtboard("home", { width: 200, height: 100 }),
    compiledArtboard("moved", { width: 500, height: 100 }),
    compiledArtboard("empty", { width: 200, height: 100 }),
  ]);

  // 2 枚目を動かしても 3 枚目は動かない（200 + 32 + 500 + 32）
  expect(withPlaced[2]).toEqual({ x: 764, y: 0 });
  expect(withPlaced[2]).toEqual(withoutPlaced[2]);
});

test("先頭が位置を持たないときは原点へ置かれる", () => {
  const positions = positionsOf([
    compiledArtboard("home", { width: 200, height: 100 }),
  ]);

  expect(positions[0]).toEqual({ x: 0, y: 0 });
});

test("並び順は入力のまま保たれる", () => {
  const arranged = ArrangedArtboard.fromArtboards([
    compiledArtboard("home", { width: 200, height: 100 }),
    compiledArtboard("placed", { width: 500, height: 100 }, { x: 900, y: 300 }),
    compiledArtboard("empty", { width: 200, height: 100 }),
  ]);

  expect(arranged.map(({ artboard }) => artboard.element.name)).toEqual([
    "home",
    "placed",
    "empty",
  ]);
});

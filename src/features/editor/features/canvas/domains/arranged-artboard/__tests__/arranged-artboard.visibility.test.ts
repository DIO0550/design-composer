import { expect, test } from "vitest";
import type { CompiledArtboard } from "@/domains/compiled/compiled-artboard";
import { Visibilities } from "@/domains/dcmp/visibility";
import { ArrangedArtboard } from "../index";
import { compiledArtboard } from "./setup";

/**
 * 置き場所を決めてから、描く artboard だけを残す。
 *
 * @param artboards 置き場所を決める対象
 * @returns 描く artboard の並び
 */
function collectVisibleArranged(
  artboards: readonly CompiledArtboard[],
): readonly ArrangedArtboard[] {
  return ArrangedArtboard.collectVisible(
    ArrangedArtboard.fromArtboards(artboards),
  );
}

function withHidden(artboard: CompiledArtboard): CompiledArtboard {
  return { ...artboard, visibility: Visibilities.Hidden };
}

test("描く artboard を集めると、非表示の artboard は除かれる", () => {
  const visible = collectVisibleArranged([
    compiledArtboard("home", { width: 200, height: 100 }),
    withHidden(compiledArtboard("draft", { width: 300, height: 100 })),
  ]);

  expect(visible.map(({ artboard }) => artboard.element.name)).not.toContain(
    "draft",
  );
});

test("描く artboard を集めても、表示の artboard は元の並び順のまま残る", () => {
  const visible = collectVisibleArranged([
    compiledArtboard("home", { width: 200, height: 100 }),
    withHidden(compiledArtboard("draft", { width: 300, height: 100 })),
    compiledArtboard("about", { width: 200, height: 100 }),
  ]);

  expect(visible.map(({ artboard }) => artboard.element.name)).toEqual([
    "home",
    "about",
  ]);
});

test("非表示の artboard の後ろにある位置を持たない artboard は、隠す前と同じ位置に置かれる", () => {
  // 隠す artboard の幅を 0 にしない（累積から外す実装でも同じ答えになる入力を避ける）
  const visible = collectVisibleArranged([
    compiledArtboard("home", { width: 200, height: 100 }),
    withHidden(compiledArtboard("draft", { width: 300, height: 100 })),
    compiledArtboard("about", { width: 200, height: 100 }),
  ]);

  // 200 + 32 + 300 + 32（隠した artboard の幅と間隔も数える）
  expect(visible[1].canvasPosition).toEqual({ x: 564, y: 0 });
});

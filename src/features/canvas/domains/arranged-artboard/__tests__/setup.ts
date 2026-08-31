import type { CompiledArtboard } from "@/domains/compiled/compiled-artboard";
import { BoxElement } from "@/domains/compiled/compiled-element";
import type { Offset } from "@/domains/unit/offset";

/**
 * 置き場所を決める入力になる artboard。中身は空の枠にする（置き場所しか問わないため）。
 *
 * @param name 見分けるための名前
 * @param size 自動配置の起点と、占める大きさに効く幅・高さ
 * @param canvasPosition ファイルに書かれている位置。省略すると書かれていない artboard
 * @returns コンパイル済み artboard の体裁を持つフィクスチャ
 */
export function compiledArtboard(
  name: string,
  size: Readonly<{ width: number; height: number }>,
  canvasPosition?: Offset,
): CompiledArtboard {
  return {
    element: BoxElement.create(name, [], []),
    width: size.width,
    height: size.height,
    canvasPosition,
  };
}

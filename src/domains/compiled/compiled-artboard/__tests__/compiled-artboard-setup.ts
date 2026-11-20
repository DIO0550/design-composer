import { DefaultTokenRefs } from "@/domains/__tests__/token-refs";
import { Artboard } from "@/domains/dcmp/artboard";
import type { Props } from "@/domains/dcmp/node";
import { CompiledArtboard } from "../index";

/**
 * props から子を持たない artboard 1 つを既定テンプレートのトークンでコンパイルする。
 *
 * @param props artboard に設定されている props（デフォルト解決前）
 * @returns コンパイルした artboard
 */
export function setupCompiledArtboard(props: Props): CompiledArtboard {
  return CompiledArtboard.fromArtboard(
    Artboard.create({ name: "home", width: 360, height: 240, props }),
    [],
    DefaultTokenRefs,
  );
}

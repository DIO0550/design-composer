import type { Artboard } from "@/domains/artboard";
import type { BoxElement } from "@/domains/compiled-element";

/**
 * コンパイル済みの artboard 1 枚。描く中身と、宣言されている大きさ。
 *
 * 大きさを別に持つのは、キャンバスのラベルが `720 × 900` を出すため（#184）。
 * `element.style` にも `width` / `height` は載っているが、そちらは CSS 出力の綴り
 * （`"720px"`）なので、読み戻すと表示側が出力形式に依存する。
 */
export type CompiledArtboard = Readonly<{
  element: BoxElement;
  width: number;
  height: number;
}>;

export const CompiledArtboard = {
  /**
   * 宣言元の artboard と、それをコンパイルした中身を対にする。
   *
   * 大きさを直接受け取らず artboard から読むのは、`element.style` と食い違う
   * 大きさを持つ値を作れなくするため。artboard の `width` / `height` は
   * `BoxElement.declarations` が `style` へ写す元でもあるので、ここから取れば
   * 2 つが同じ出どころになる。
   *
   * @param artboard 大きさの出どころになる、コンパイル前の artboard
   * @param element その artboard をコンパイルした中身
   * @returns 中身と大きさを対にしたコンパイル結果
   */
  fromArtboard(artboard: Artboard, element: BoxElement): CompiledArtboard {
    return { element, width: artboard.width, height: artboard.height };
  },
} as const;

import {
  BoxElement,
  type CompiledElement,
} from "@/domains/compiled/compiled-element";
import { Artboard } from "@/domains/dcmp/artboard";
import type { TokenRefs } from "@/domains/dcmp/css-declaration";
import type { Offset } from "@/domains/unit/offset";

/**
 * コンパイル済みの artboard 1 枚。描く中身と、宣言されている大きさ・キャンバス上の位置。
 *
 * 大きさを別に持つのは、キャンバスのラベルが `720 × 900` を出すため（#184）。
 * `element.style` にも `width` / `height` は載っているが、そちらは CSS 出力の綴り
 * （`"720px"`）なので、読み戻すと表示側が出力形式に依存する。
 *
 * 位置が省略されうるのは、ファイルに書かれていない artboard があるため。
 * 書かれていないものをどこへ置くかは描く側が決める（`ArrangedArtboard`）。
 */
export type CompiledArtboard = Readonly<{
  element: BoxElement;
  width: number;
  height: number;
  canvasPosition?: Offset;
}>;

export const CompiledArtboard = {
  /**
   * artboard と、コンパイル済みの子から 1 枚ぶんのコンパイル結果を作る。
   *
   * 中身を組み立てずに受け取らないのは、`element.style` と食い違う大きさを持つ値を
   * 作れなくするため。大きさも style も同じ `Artboard` から引くので、2 つが割れない。
   *
   * @param artboard 中身と大きさの出どころになる、コンパイル前の artboard
   * @param children ref 展開とコンパイルを終えた子の並び
   * @param tokens カスタムプロパティ名の綴り方（出力層の知識なので引数で受け取る）
   * @returns 中身と、大きさ・キャンバス上の位置を対にしたコンパイル結果。
   *   位置は artboard が持っていなければそのまま持たない
   */
  fromArtboard(
    artboard: Artboard,
    children: readonly CompiledElement[],
    tokens: TokenRefs,
  ): CompiledArtboard {
    const element = BoxElement.create(
      artboard.name,
      // artboard は親を持たないが、サイズは常に fixed なので親の向きに依存しない
      // (配置は `boxProps` が `flow` に固定するので、絶対配置の子の基準になる)
      BoxElement.declarations(Artboard.boxProps(artboard), undefined, tokens),
      children,
    );
    return {
      element,
      width: artboard.width,
      height: artboard.height,
      canvasPosition: artboard.canvasPosition,
    };
  },
} as const;

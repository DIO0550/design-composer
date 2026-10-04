import {
  BoxElement,
  type CompiledElement,
} from "@/domains/compiled/compiled-element";
import { Artboard } from "@/domains/dcmp/artboard";
import type { TokenRefs } from "@/domains/dcmp/css-declaration";
import { Visibility } from "@/domains/dcmp/visibility";
import type { Offset } from "@/domains/unit/offset";
import { Option } from "@/utils/Option";

/**
 * コンパイル済みの artboard 1 枚。描く中身と、宣言されている大きさ・キャンバス上の位置・
 * 表示 / 非表示。
 *
 * `element.style` にも `width` / `height` は載っているが、そちらは CSS 出力の綴り（`"720px"`）
 * なので、読み戻すと表示側が出力形式に依存する。
 *
 * 書かれていないものをどこへ置くかは描く側が決める（`ArrangedArtboard`）。
 */
export type CompiledArtboard = Readonly<{
  element: BoxElement;
  width: number;
  height: number;
  canvasPosition?: Offset;
  visibility: Visibility;
}>;

export const CompiledArtboard = {
  /**
   * artboard と、コンパイル済みの子から 1 枚ぶんのコンパイル結果を作る。
   *
   * 大きさも style も同じ `Artboard` から引くので、2 つが割れない。
   *
   * @param artboard 中身と大きさの出どころになる、コンパイル前の artboard
   * @param children ref 展開とコンパイルを終えた子の並び
   * @param tokens カスタムプロパティ名の綴り方と塗りの名前の解決（出力層の知識なので引数で受け取る）
   * @returns 中身と、大きさ・キャンバス上の位置・表示 / 非表示を対にしたコンパイル結果。
   *   位置は artboard が持っていなければそのまま持たない
   */
  fromArtboard(
    artboard: Artboard,
    children: readonly CompiledElement[],
    tokens: TokenRefs,
  ): CompiledArtboard {
    const props = Artboard.boxProps(artboard);
    const element = BoxElement.create(
      artboard.name,
      // artboard は親を持たないので並べる向きも無い。サイズは常に fixed なので
      // 向きに依存しない (配置は `boxProps` が `flow` に固定するので、絶対配置の子の基準になる)
      BoxElement.declarations(props, Option.none, tokens),
      children,
    );
    return {
      element,
      width: artboard.width,
      height: artboard.height,
      canvasPosition: artboard.canvasPosition,
      visibility: Visibility.fromProps(props),
    };
  },

  /**
   * キャンバスに枠・見出し・リサイズハンドルを描く artboard か（docs/03「表示 / 非表示」）。
   *
   * @param artboard 判定するコンパイル結果
   * @returns 表示なら `true`。非表示なら `false`
   */
  isVisible(artboard: CompiledArtboard): boolean {
    return Visibility.isVisible(artboard.visibility);
  },
} as const;

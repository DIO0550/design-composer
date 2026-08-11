import { Artboard } from "@/domains/artboard";
import { CompiledArtboard } from "@/domains/compiled-artboard";
import { BoxElement, CompiledElement } from "@/domains/compiled-element";
import { CssDeclarations } from "@/domains/css-declaration";
import type { DesignDocument } from "@/domains/design-document";
import { InstanceComposition } from "@/services/instance-composition";
import { NodeHtml, type ParentContext } from "@/services/node-html";
import { type CssVariables, TokenCss } from "@/services/token-css";
import { Html } from "@/utils/Html";
import { Result } from "@/utils/Result";

export type { CssVariables };

/**
 * ドキュメント全体のコンパイル結果。
 * トークンはルート要素のカスタムプロパティ、artboard はその下に並ぶ要素になる
 * (docs/03「ルート要素に `--{種別}-{名前}: 値` を出力し、ノード側は `var()` で参照する」)。
 *
 * artboard 同士の配置は持たない。キャンバス座標は source of truth ではなく、
 * 配列順からの自動レイアウトはキャンバス側の非永続な view state だから (docs/01)。
 */
export type CompiledDocument = Readonly<{
  variables: CssVariables;
  artboards: readonly CompiledArtboard[];
}>;

/**
 * artboard を Box としてコンパイルする。子は ref 展開を通してから並べる。
 *
 * @param artboard コンパイル対象の artboard
 * @param document 部品の引き先になるドキュメント
 * @returns コンパイル済みの中身と、宣言されている大きさ。
 *   ref の展開か子のコンパイルが失敗すればその失敗
 */
function compileArtboard(
  artboard: Artboard,
  document: DesignDocument,
): Result<CompiledArtboard, Error> {
  // 子のコンパイルより先に要る（`fill` の出し分けが親の向きに依存する）ので、
  // 中身の組み立てを `CompiledArtboard` へ預けたあともここに残る
  const childParent: ParentContext = {
    direction: BoxElement.childDirection(Artboard.boxProps(artboard)),
  };
  return Result.flatMap(
    InstanceComposition.expandAll(artboard.children, document.components),
    (expanded) =>
      Result.map(NodeHtml.compileAll(expanded, childParent), (children) =>
        CompiledArtboard.fromArtboard(artboard, children, TokenCss.refs),
      ),
  );
}

/**
 * すべての artboard をコンパイルする。1 枚でも失敗したら全体を失敗にする。
 *
 * @param document コンパイル対象のドキュメント
 * @returns 並び順を保ったコンパイル結果。1 枚でも失敗すればその失敗
 */
function compileArtboards(
  document: DesignDocument,
): Result<readonly CompiledArtboard[], Error> {
  const compiled: CompiledArtboard[] = [];
  for (const artboard of document.artboards) {
    const result = compileArtboard(artboard, document);
    if (!result.ok) {
      return result;
    }
    compiled.push(result.value);
  }
  return Result.ok(compiled);
}

/** ドキュメント全体を、トークンの値に依存しない描画可能な形へコンパイルする。 */
export const DocumentHtml = {
  /**
   * ドキュメントをレンダリング可能な形へコンパイルする。
   * 出力はトークンの値に依存せず `var()` 参照だけを持つため、
   * トークンの編集はルート要素の変数の差し替えだけで全 artboard へ波及する。
   */
  compile(document: DesignDocument): Result<CompiledDocument, Error> {
    return Result.map(compileArtboards(document), (artboards) => ({
      variables: TokenCss.variables(document.tokens),
      artboards,
    }));
  },

  /** ルート要素の style へ載せる形（カスタムプロパティの並び）に直列化する。 */
  rootStyleText(compiled: CompiledDocument): string {
    return CssDeclarations.toStyleText(compiled.variables);
  },

  /** コンパイル結果を HTML 文字列にする。ルート `div` がカスタムプロパティを持つ。 */
  html(compiled: CompiledDocument): string {
    const style = Html.escapeAttribute(DocumentHtml.rootStyleText(compiled));
    const artboards = compiled.artboards
      .map((artboard) => CompiledElement.html(artboard.element))
      .join("");
    return `<div style="${style}">${artboards}</div>`;
  },

  /** ドキュメント1つから HTML/CSS 一式を得る。 */
  toHtml(document: DesignDocument): Result<string, Error> {
    return Result.map(DocumentHtml.compile(document), DocumentHtml.html);
  },
} as const;

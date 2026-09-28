import {
  DefaultTokenRefs,
  tokenRefsFrom,
} from "@/domains/__tests__/token-refs";
import { CssDeclarations } from "@/domains/dcmp/css-declaration";
import type { CssDirection } from "@/domains/dcmp/css-direction";
import type { Props } from "@/domains/dcmp/node";
import { ResolvedProps } from "@/domains/dcmp/resolved-props";
import type { TokenSet } from "@/domains/dcmp/token";
import { Option } from "@/utils/Option";
import { BoxElement, TextElement } from "../index";

/**
 * props から Box 1 つ分の style を組み立てる。
 *
 * @param props 設定されている props（デフォルト解決前）
 * @param placed この Box の置かれ方。`parentDirection` は flex アイテムとして並べる親の
 *   向き（省くと親を持たない位置）、`tokens` は塗りの名前を引くトークン一式（省くと
 *   既定テンプレート）
 * @returns その位置に置いたときの style
 */
export function setupBoxStyle(
  props: Props,
  placed: Readonly<{
    parentDirection?: Option<CssDirection>;
    tokens?: TokenSet;
  }> = {},
): CssDeclarations {
  return CssDeclarations.from(
    BoxElement.declarations(
      ResolvedProps.resolve("Box", props),
      placed.parentDirection ?? Option.none,
      placed.tokens === undefined
        ? DefaultTokenRefs
        : tokenRefsFrom(placed.tokens),
    ),
  );
}

/**
 * props から Text 1 つ分の style を組み立てる。
 *
 * @param props 設定されている props（デフォルト解決前）
 * @returns その Text の style
 */
export function setupTextStyle(props: Props): CssDeclarations {
  return CssDeclarations.from(
    TextElement.declarations(
      ResolvedProps.resolve("Text", props),
      DefaultTokenRefs,
    ),
  );
}

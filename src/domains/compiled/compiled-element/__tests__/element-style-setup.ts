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
 * @param parentDirection この Box を flex アイテムとして並べる親の向き。省くと親を持たない
 *   位置に置く
 * @returns その位置に置いたときの style
 */
export function setupBoxStyle(
  props: Props,
  parentDirection: Option<CssDirection> = Option.none,
): CssDeclarations {
  return CssDeclarations.from(
    BoxElement.declarations(
      ResolvedProps.resolve("Box", props),
      parentDirection,
      DefaultTokenRefs,
    ),
  );
}

/**
 * 塗りの名前の解決に使うトークン一式を差し替えて、Box 1 つ分の style を組み立てる。
 *
 * @param props 設定されている props（デフォルト解決前）
 * @param tokens 塗りの名前を引くトークン一式
 * @returns 親を持たない位置に置いたときの style
 */
export function setupBoxStyleWithTokens(
  props: Props,
  tokens: TokenSet,
): CssDeclarations {
  return CssDeclarations.from(
    BoxElement.declarations(
      ResolvedProps.resolve("Box", props),
      Option.none,
      tokenRefsFrom(tokens),
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

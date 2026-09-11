import { TokenRefSpelling } from "@/domains/__tests__/token-refs";
import { CssDeclarations } from "@/domains/dcmp/css-declaration";
import type { Props } from "@/domains/dcmp/node";
import { ResolvedProps } from "@/domains/dcmp/resolved-props";
import { Option } from "@/utils/Option";
import { BoxElement, TextElement } from "../index";

/**
 * props から Box 1 つ分の style を組み立てる。
 *
 * @param props 設定されている props（デフォルト解決前）
 * @returns 親を持たない位置に置いたときの style
 */
export function setupBoxStyle(props: Props): CssDeclarations {
  return CssDeclarations.from(
    BoxElement.declarations(
      ResolvedProps.resolve("Box", props),
      Option.none,
      TokenRefSpelling,
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
      TokenRefSpelling,
    ),
  );
}

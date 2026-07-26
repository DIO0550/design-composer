import type { CssDeclaration } from "@/domains/css-declaration";
import { CssDeclarations } from "@/domains/css-declaration";

/**
 * コンパイル済みの Box。子を持ち、テキストは持たない。
 * 出力は `div` + インライン style であり (docs/03)、タグの区別は持たない。
 */
export type BoxElement = Readonly<{
  kind: "box";
  name: string;
  style: CssDeclarations;
  children: readonly CompiledElement[];
}>;

/** コンパイル済みの Text。テキストを持ち、子は持たない。 */
export type TextElement = Readonly<{
  kind: "text";
  name: string;
  style: CssDeclarations;
  content: string;
}>;

/** Box と Text のどちらか。両方の性質を持つ状態は構造上作れない。 */
export type CompiledElement = BoxElement | TextElement;

export const BoxElement = {
  /** 宣言の並びをそのまま受け取り、style へのまとめ上げはここで行う。 */
  create(
    name: string,
    declarations: readonly CssDeclaration[],
    children: readonly CompiledElement[],
  ): BoxElement {
    return {
      kind: "box",
      name,
      style: CssDeclarations.from(declarations),
      children,
    };
  },
} as const;

export const TextElement = {
  /** 宣言の並びをそのまま受け取り、style へのまとめ上げはここで行う。 */
  create(
    name: string,
    declarations: readonly CssDeclaration[],
    content: string,
  ): TextElement {
    return {
      kind: "text",
      name,
      style: CssDeclarations.from(declarations),
      content,
    };
  },
} as const;

export const CompiledElement = {
  isBox(element: CompiledElement): element is BoxElement {
    return element.kind === "box";
  },

  isText(element: CompiledElement): element is TextElement {
    return element.kind === "text";
  },

  /** style 属性へ載せられる宣言の並びに直列化する。 */
  styleText(element: CompiledElement): string {
    return CssDeclarations.toStyleText(element.style);
  },

  /** 自身と子孫を行きがけ順に辿る。 */
  flatten(element: CompiledElement): readonly CompiledElement[] {
    if (CompiledElement.isText(element)) {
      return [element];
    }
    return [element, ...element.children.flatMap(CompiledElement.flatten)];
  },
} as const;

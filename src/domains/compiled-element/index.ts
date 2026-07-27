import type {
  CssDeclaration as CssDeclarationType,
  CssProperty,
  SingleVariableTokenKind,
  TokenRefs,
} from "@/domains/css-declaration";
import { CssDeclaration, CssDeclarations } from "@/domains/css-declaration";
import { CssDirection } from "@/domains/css-direction";
import type { PropValue } from "@/domains/node";
import { Padding } from "@/domains/padding";
import type { ResolvedProps } from "@/domains/resolved-props";
import { Size } from "@/domains/size";
import { TypographyField, TypographyToken } from "@/domains/token";

/**
 * トークン参照 prop を `var()` 参照の宣言にする。未指定の prop は宣言を出力しない
 * (トークンの値は参照しないため、トークン編集は再コンパイルなしに CSS 経由で波及する)。
 */
function tokenDeclarations(
  property: CssProperty,
  kind: SingleVariableTokenKind,
  value: PropValue | undefined,
  tokens: TokenRefs,
): readonly CssDeclarationType[] {
  if (value === undefined) {
    return [];
  }
  return [CssDeclaration.create(property, tokens.ref(kind, String(value)))];
}

/** 初期値と同じ `visible` は宣言を出力しない (docs/03 の表は clip のみを規定)。 */
function overflowDeclarations(
  overflow: PropValue | undefined,
): readonly CssDeclarationType[] {
  return overflow === "clip"
    ? [CssDeclaration.create("overflow", "hidden")]
    : [];
}

/**
 * typography は複合トークンなので、フィールドごとの CSS プロパティへ展開する。
 * 走査対象は `TypographyToken.fields()` に従うため、トークンのフィールドが増えても追従漏れが出ない。
 */
function typographyDeclarations(
  typography: PropValue | undefined,
  tokens: TokenRefs,
): readonly CssDeclarationType[] {
  if (typography === undefined) {
    return [];
  }
  const name = String(typography);
  return TypographyToken.fields().map((field): CssDeclarationType => {
    const property = TypographyField.cssProperty(field);
    return CssDeclaration.create(
      property,
      tokens.typographyRef(name, property),
    );
  });
}

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
    declarations: readonly CssDeclarationType[],
    children: readonly CompiledElement[],
  ): BoxElement {
    return {
      kind: "box",
      name,
      style: CssDeclarations.from(declarations),
      children,
    };
  },

  /**
   * Box の props を CSS の宣言へ写す (docs/03「HTML/CSS へのコンパイル規則」の表)。
   * 各 prop の規則はそれぞれのドメイン (Padding / Size / CssDirection) が持ち、
   * ここはその並び順 = 宣言の出力順を決める。
   */
  declarations(
    props: ResolvedProps<"Box">,
    parentDirection: CssDirection | undefined,
    tokens: TokenRefs,
  ): readonly CssDeclarationType[] {
    return [
      CssDeclaration.create("display", "flex"),
      CssDeclaration.create("flex-direction", String(props.direction)),
      ...tokenDeclarations("gap", "spacing", props.gap, tokens),
      ...Padding.declarations(
        Padding.create(props.paddingY, props.paddingX),
        (token) => tokens.ref("spacing", token),
      ),
      CssDeclaration.create("align-items", String(props.align)),
      CssDeclaration.create("justify-content", String(props.justify)),
      ...Size.declarations(
        Size.create(props.widthMode, props.width),
        "width",
        parentDirection,
      ),
      ...Size.declarations(
        Size.create(props.heightMode, props.height),
        "height",
        parentDirection,
      ),
      ...tokenDeclarations("background", "colors", props.background, tokens),
      ...tokenDeclarations("border-radius", "radius", props.radius, tokens),
      ...tokenDeclarations("box-shadow", "shadows", props.shadow, tokens),
      ...overflowDeclarations(props.overflow),
    ];
  },

  /** 子を並べる向き。子の `fill` の出し分けはこの向きに従う。 */
  childDirection(props: ResolvedProps<"Box">): CssDirection {
    return CssDirection.from(props.direction);
  },
} as const;

export const TextElement = {
  /** 宣言の並びをそのまま受け取り、style へのまとめ上げはここで行う。 */
  create(
    name: string,
    declarations: readonly CssDeclarationType[],
    content: string,
  ): TextElement {
    return {
      kind: "text",
      name,
      style: CssDeclarations.from(declarations),
      content,
    };
  },

  /** Text の props を CSS の宣言へ写す (docs/03 の表)。 */
  declarations(
    props: ResolvedProps<"Text">,
    tokens: TokenRefs,
  ): readonly CssDeclarationType[] {
    return [
      ...typographyDeclarations(props.typography, tokens),
      ...tokenDeclarations("color", "colors", props.color, tokens),
      CssDeclaration.create("text-align", String(props.align)),
    ];
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

import type {
  CssDeclaration as CssDeclarationType,
  CssProperty,
  TokenRefs,
} from "@/domains/css-declaration";
import { CssDeclaration, CssDeclarations } from "@/domains/css-declaration";
import { CssDirection } from "@/domains/css-direction";
import type { PropValue } from "@/domains/node";
import { Padding } from "@/domains/padding";
import { TokenPropKinds, type TokenPropName } from "@/domains/primitive-schema";
import type { ResolvedProps } from "@/domains/resolved-props";
import { Size } from "@/domains/size";
import { TypographyField, TypographyToken } from "@/domains/token";
import { Html } from "@/utils/Html";

/**
 * トークン参照 prop → その prop が決める CSS プロパティ
 * (docs/03「HTML/CSS へのコンパイル規則」の表。仕様と同じく prop 名で引く)。
 * 引くトークン種別はスキーマの `tokenKind` だけが宣言するため、ここには書かず
 * `TokenPropKinds.kindOf` から引く (`gap` を colors から引く組み合わせを書けない)。
 * `paddingTop` などの4方向は1つの `padding` へ合成するため `Padding` が、
 * `typography` は複数プロパティへ展開されるため下の関数が担当し、この表には含めない。
 */
const TokenPropProperties = {
  gap: "gap",
  background: "background",
  radius: "border-radius",
  shadow: "box-shadow",
  color: "color",
} as const satisfies Readonly<Partial<Record<TokenPropName, CssProperty>>>;

/** 単一の CSS プロパティへ写るトークン参照 prop。語彙は上の表で閉じている。 */
type TokenBackedProp = keyof typeof TokenPropProperties;

/**
 * トークン参照 prop を `var()` 参照の宣言にする。未指定の prop は宣言を出力しない
 * (トークンの値は参照しないため、トークン編集は再コンパイルなしに CSS 経由で波及する)。
 *
 * @param prop 宣言にする prop 名
 * @param value その prop に設定されている値。未設定なら宣言を出さない
 * @param tokens カスタムプロパティ名の綴り方
 * @returns `var()` 参照の宣言 1 件。未設定なら空
 */
function tokenDeclarations(
  prop: TokenBackedProp,
  value: PropValue | undefined,
  tokens: TokenRefs,
): readonly CssDeclarationType[] {
  if (value === undefined) {
    return [];
  }
  const property = TokenPropProperties[prop];
  const kind = TokenPropKinds.kindOf(prop);
  return [CssDeclaration.create(property, tokens.ref(kind, String(value)))];
}

/**
 * 初期値と同じ `visible` は宣言を出力しない (docs/03 の表は clip のみを規定)。
 *
 * @param overflow `overflow` prop に設定されている値
 * @returns `clip` のときだけ `overflow: hidden` の宣言 1 件。それ以外は空
 */
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
 *
 * @param typography `typography` prop に設定されているトークン名。未設定なら宣言を出さない
 * @param tokens カスタムプロパティ名の綴り方
 * @returns フィールドごとの `var()` 参照の宣言。未設定なら空
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
 * ノードの `name` を出力へ残す属性。
 * 出力だけを見てどのノードかを追えるようにするためのもので、
 * 描いた結果から名前を引く側 (キャンバスの選択) も同じ綴りを使う。
 */
export const ElementNameAttribute = "data-name";

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
      ...tokenDeclarations("gap", props.gap, tokens),
      /*
       * prop 名と辺の対応は、スキーマの `shorthand` 宣言（`paddingTop` は padding の
       * 上辺、など）と同じ事実をここでも書いている。宣言から導くと CSS 出力が
       * スキーマ走査に依存するので今は分けてある（片方を直したらもう片方も直す）。
       */
      ...Padding.declarations(
        Padding.create({
          top: props.paddingTop,
          right: props.paddingRight,
          bottom: props.paddingBottom,
          left: props.paddingLeft,
        }),
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
      ...tokenDeclarations("background", props.background, tokens),
      ...tokenDeclarations("radius", props.radius, tokens),
      ...tokenDeclarations("shadow", props.shadow, tokens),
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
      ...tokenDeclarations("color", props.color, tokens),
      CssDeclaration.create("text-align", String(props.align)),
    ];
  },
} as const;

export const CompiledElement = {
  /** 子を持つ側の要素か。 */
  isBox(element: CompiledElement): element is BoxElement {
    return element.kind === "box";
  },

  /** テキストを持つ側の要素か。 */
  isText(element: CompiledElement): element is TextElement {
    return element.kind === "text";
  },

  /** style 属性へ載せられる宣言の並びに直列化する。 */
  styleText(element: CompiledElement): string {
    return CssDeclarations.toStyleText(element.style);
  },

  /**
   * `div` + インライン style の HTML へ直列化する (docs/03)。
   * ノードの `name` は `ElementNameAttribute` として残す。
   */
  html(element: CompiledElement): string {
    const attributes = `${ElementNameAttribute}="${Html.escapeAttribute(element.name)}" style="${Html.escapeAttribute(CompiledElement.styleText(element))}"`;
    const content = CompiledElement.isText(element)
      ? Html.escapeText(element.content)
      : element.children.map(CompiledElement.html).join("");
    return `<div ${attributes}>${content}</div>`;
  },

  /** 自身と子孫を行きがけ順に辿る。 */
  flatten(element: CompiledElement): readonly CompiledElement[] {
    if (CompiledElement.isText(element)) {
      return [element];
    }
    return [element, ...element.children.flatMap(CompiledElement.flatten)];
  },
} as const;

import {
  BoxElement,
  type CompiledElement,
  TextElement,
} from "@/domains/compiled-element";
import type { CssDeclarations, CssProperty } from "@/domains/css-declaration";
import { CssDeclaration } from "@/domains/css-declaration";
import { CssDirection } from "@/domains/css-direction";
import type { Props, PropValue } from "@/domains/node";
import { Padding } from "@/domains/padding";
import { PrimitiveSchema } from "@/domains/primitive-schema";
import { Size } from "@/domains/size";
import { TypographyField, TypographyToken } from "@/domains/token";
import type { ExpandedNode } from "@/services/instance-composition";
import { ResolvedProps } from "@/services/resolved-props";
import type { SingleVariableTokenKind } from "@/services/token-css";
import { TokenCss } from "@/services/token-css";
import { Result } from "@/utils/Result";

export type { CompiledElement, CssDeclarations };

/**
 * `widthMode` / `heightMode` の `fill` の出し分けにだけ必要な親の情報
 * (docs/03「`widthMode: fill` の出し分けが唯一親コンテキストに依存するコンパイル」)。
 * 親を持たない位置では `undefined` を渡す。
 */
export type ParentContext = Readonly<{ direction: CssDirection }>;

/**
 * トークン参照 prop を `var()` 参照の宣言にする。未指定の prop は宣言を出力しない
 * (トークンの値は参照しないため、トークン編集は再コンパイルなしに CSS 経由で波及する)。
 */
function tokenDeclarations(
  property: CssProperty,
  kind: SingleVariableTokenKind,
  value: PropValue | undefined,
): readonly CssDeclaration[] {
  if (value === undefined) {
    return [];
  }
  return [CssDeclaration.create(property, TokenCss.ref(kind, String(value)))];
}

/** spacing トークン名を `var()` 参照に変換する。 */
function spacingRef(token: string): string {
  return TokenCss.ref("spacing", token);
}

/** 初期値と同じ `visible` は宣言を出力しない (docs/03 の表は clip のみを規定)。 */
function overflowDeclarations(
  overflow: PropValue | undefined,
): readonly CssDeclaration[] {
  return overflow === "clip"
    ? [CssDeclaration.create("overflow", "hidden")]
    : [];
}

function boxDeclarations(
  props: ResolvedProps<"Box">,
  parent: ParentContext | undefined,
): readonly CssDeclaration[] {
  return [
    CssDeclaration.create("display", "flex"),
    CssDeclaration.create("flex-direction", String(props.direction)),
    ...tokenDeclarations("gap", "spacing", props.gap),
    ...Padding.declarations(
      Padding.create(props.paddingY, props.paddingX),
      spacingRef,
    ),
    CssDeclaration.create("align-items", String(props.align)),
    CssDeclaration.create("justify-content", String(props.justify)),
    ...Size.declarations(
      Size.create(props.widthMode, props.width),
      "width",
      parent?.direction,
    ),
    ...Size.declarations(
      Size.create(props.heightMode, props.height),
      "height",
      parent?.direction,
    ),
    ...tokenDeclarations("background", "colors", props.background),
    ...tokenDeclarations("border-radius", "radius", props.radius),
    ...tokenDeclarations("box-shadow", "shadows", props.shadow),
    ...overflowDeclarations(props.overflow),
  ];
}

/**
 * typography は複合トークンなので、フィールドごとの CSS プロパティへ展開する。
 * 走査対象は `TypographyToken.fields()` に従うため、トークンのフィールドが増えても追従漏れが出ない。
 */
function typographyDeclarations(
  typography: PropValue | undefined,
): readonly CssDeclaration[] {
  if (typography === undefined) {
    return [];
  }
  const name = String(typography);
  return TypographyToken.fields().map((field): CssDeclaration => {
    const property = TypographyField.cssProperty(field);
    return CssDeclaration.create(
      property,
      TokenCss.typographyRef(name, property),
    );
  });
}

function textDeclarations(
  props: ResolvedProps<"Text">,
): readonly CssDeclaration[] {
  return [
    ...typographyDeclarations(props.typography),
    ...tokenDeclarations("color", "colors", props.color),
    CssDeclaration.create("text-align", String(props.align)),
  ];
}

function compileText(name: string, props: Props): CompiledElement {
  const resolved = ResolvedProps.resolve("Text", props);
  return TextElement.create(
    name,
    textDeclarations(resolved),
    String(resolved.content),
  );
}

function compileBox(
  node: ExpandedNode,
  parent: ParentContext | undefined,
): Result<CompiledElement, Error> {
  const resolved = ResolvedProps.resolve("Box", node.props ?? {});
  const childParent: ParentContext = {
    direction: CssDirection.from(resolved.direction),
  };
  return Result.map(
    compileNodes(node.children ?? [], childParent),
    (children): CompiledElement =>
      BoxElement.create(node.name, boxDeclarations(resolved, parent), children),
  );
}

function compileNode(
  node: ExpandedNode,
  parent: ParentContext | undefined,
): Result<CompiledElement, Error> {
  const type = node.type;
  if (!PrimitiveSchema.isPrimitiveType(type)) {
    return Result.err(
      new Error(`unknown primitive type "${type}" at node "${node.name}"`),
    );
  }
  if (type === "Text") {
    return Result.ok(compileText(node.name, node.props ?? {}));
  }
  return compileBox(node, parent);
}

function compileNodes(
  nodes: readonly ExpandedNode[],
  parent: ParentContext | undefined,
): Result<readonly CompiledElement[], Error> {
  const compiled: CompiledElement[] = [];
  for (const node of nodes) {
    const result = compileNode(node, parent);
    if (!result.ok) {
      return result;
    }
    compiled.push(result.value);
  }
  return Result.ok(compiled);
}

export const NodeHtml = {
  /**
   * ノードを `div` + インライン style の要素へコンパイルする。
   * 入力は ref 展開済みのノード (`InstanceComposition.expand` の結果)。
   * 未知の `type` はバリデーションで検出される対象だが、単体でも安全に扱えるよう Err を返す。
   */
  compile(
    node: ExpandedNode,
    parent?: ParentContext,
  ): Result<CompiledElement, Error> {
    return compileNode(node, parent);
  },

  compileAll(
    nodes: readonly ExpandedNode[],
    parent?: ParentContext,
  ): Result<readonly CompiledElement[], Error> {
    return compileNodes(nodes, parent);
  },
} as const;

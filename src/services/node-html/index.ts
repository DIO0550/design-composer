import {
  BoxElement,
  type CompiledElement,
  TextElement,
} from "@/domains/compiled-element";
import { CssDeclaration, CssDeclarations } from "@/domains/css-declaration";
import type { Axis } from "@/domains/css-direction";
import { CssDirection } from "@/domains/css-direction";
import type { Props, PropValue } from "@/domains/node";
import { Padding } from "@/domains/padding";
import { PrimitiveSchema } from "@/domains/primitive-schema";
import { Px } from "@/domains/px";
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
  property: string,
  kind: SingleVariableTokenKind,
  value: PropValue | undefined,
): readonly CssDeclaration[] {
  if (value === undefined) {
    return [];
  }
  return [CssDeclaration.create(property, TokenCss.ref(kind, String(value)))];
}

/** 2軸のパディングを宣言へ合成する。合成の規則は Padding が持つ。 */
function paddingDeclarations(
  paddingY: PropValue | undefined,
  paddingX: PropValue | undefined,
): readonly CssDeclaration[] {
  return Padding.declarations(Padding.create(paddingY, paddingX), (token) =>
    TokenCss.ref("spacing", token),
  );
}

/**
 * 主軸 / 交差軸の出し分けは CssDirection が持つ。
 * 親を持たない位置では flex アイテムではないため、どちらの宣言も意味を持たず出力しない。
 */
function fillDeclarations(
  axis: Axis,
  parent: ParentContext | undefined,
): readonly CssDeclaration[] {
  if (parent === undefined) {
    return [];
  }
  return [CssDirection.fillDeclaration(parent.direction, axis)];
}

/**
 * サイズはモード(enum)と値(number)の 2 prop で決まる。
 * `fixed` 以外では値 prop は `enabledWhen` により無効なので読まない。
 */
function sizeDeclarations(
  axis: Axis,
  mode: PropValue | undefined,
  value: PropValue | undefined,
  parent: ParentContext | undefined,
): readonly CssDeclaration[] {
  if (mode === "hug") {
    return [CssDeclaration.create(axis, "fit-content")];
  }
  if (mode === "fill") {
    return fillDeclarations(axis, parent);
  }
  if (mode === "fixed" && typeof value === "number") {
    return [CssDeclaration.create(axis, Px.create(value))];
  }
  return [];
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
    ...paddingDeclarations(props.paddingY, props.paddingX),
    CssDeclaration.create("align-items", String(props.align)),
    CssDeclaration.create("justify-content", String(props.justify)),
    ...sizeDeclarations("width", props.widthMode, props.width, parent),
    ...sizeDeclarations("height", props.heightMode, props.height, parent),
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
    CssDeclarations.from(textDeclarations(resolved)),
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
      BoxElement.create(
        node.name,
        CssDeclarations.from(boxDeclarations(resolved, parent)),
        children,
      ),
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

  /** style 属性へ載せられる宣言の並びに直列化する。 */
  toStyleText(style: CssDeclarations): string {
    return CssDeclarations.toStyleText(style);
  },
} as const;

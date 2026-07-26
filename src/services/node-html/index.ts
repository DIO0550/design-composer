import type { Props, PropValue } from "@/domains/node";
import type { BOX_SCHEMA } from "@/domains/primitive-schema";
import { PrimitiveSchema } from "@/domains/primitive-schema";
import { Px } from "@/domains/px";
import { TypographyField, TypographyToken } from "@/domains/token";
import type { ExpandedNode } from "@/services/instance-composition";
import { ResolvedProps } from "@/services/resolved-props";
import type { SingleVariableTokenKind } from "@/services/token-css";
import { TokenCss } from "@/services/token-css";
import { Result } from "@/utils/Result";

/** CSS プロパティ名 → 値。style 属性へそのまま展開できる形で持つ。 */
export type CssDeclarations = Readonly<Record<string, string>>;

/** Box の `direction` が取り得る値。スキーマ定数から導出し二重管理しない。 */
export type Direction =
  (typeof BOX_SCHEMA)["props"]["direction"]["values"][number];

/**
 * `widthMode` / `heightMode` の `fill` の出し分けにだけ必要な親の情報
 * (docs/03「`widthMode: fill` の出し分けが唯一親コンテキストに依存するコンパイル」)。
 * 親を持たない位置では `undefined` を渡す。
 */
export type ParentContext = Readonly<{ direction: Direction }>;

/**
 * コンパイル結果の要素。出力はすべて `div` + インライン style であり
 * (docs/03「ノードはすべて div ＋インライン style」)、タグの区別は持たない。
 * Box は子を、Text は文字列を持ち、両方を持つ状態は構造上作れない。
 */
export type CompiledElement =
  | Readonly<{
      kind: "box";
      name: string;
      style: CssDeclarations;
      children: readonly CompiledElement[];
    }>
  | Readonly<{
      kind: "text";
      name: string;
      style: CssDeclarations;
      content: string;
    }>;

type Declaration = readonly [string, string];

type Axis = "width" | "height";

/**
 * トークン参照 prop を `var()` 参照の宣言にする。未指定の prop は宣言を出力しない
 * (トークンの値は参照しないため、トークン編集は再コンパイルなしに CSS 経由で波及する)。
 */
function tokenDeclarations(
  property: string,
  kind: SingleVariableTokenKind,
  value: PropValue | undefined,
): readonly Declaration[] {
  if (value === undefined) {
    return [];
  }
  return [[property, TokenCss.ref(kind, String(value))]];
}

/** paddingY / paddingX を `padding` 1宣言へ Y X の順で合成する。 */
function paddingDeclarations(
  paddingY: PropValue | undefined,
  paddingX: PropValue | undefined,
): readonly Declaration[] {
  if (paddingY === undefined && paddingX === undefined) {
    return [];
  }
  const y =
    paddingY === undefined ? "0" : TokenCss.ref("spacing", String(paddingY));
  const x =
    paddingX === undefined ? "0" : TokenCss.ref("spacing", String(paddingX));
  return [["padding", `${y} ${x}`]];
}

function isMainAxis(axis: Axis, direction: Direction): boolean {
  return direction === "row" ? axis === "width" : axis === "height";
}

/**
 * 親の主軸方向なら `flex-grow`、交差軸方向なら `align-self: stretch`。
 * 親を持たない位置では flex アイテムではないため、どちらの宣言も意味を持たず出力しない。
 */
function fillDeclarations(
  axis: Axis,
  parent: ParentContext | undefined,
): readonly Declaration[] {
  if (parent === undefined) {
    return [];
  }
  if (isMainAxis(axis, parent.direction)) {
    return [["flex-grow", "1"]];
  }
  return [["align-self", "stretch"]];
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
): readonly Declaration[] {
  if (mode === "hug") {
    return [[axis, "fit-content"]];
  }
  if (mode === "fill") {
    return fillDeclarations(axis, parent);
  }
  if (mode === "fixed" && typeof value === "number") {
    return [[axis, Px.create(value)]];
  }
  return [];
}

/** 初期値と同じ `visible` は宣言を出力しない (docs/03 の表は clip のみを規定)。 */
function overflowDeclarations(
  overflow: PropValue | undefined,
): readonly Declaration[] {
  return overflow === "clip" ? [["overflow", "hidden"]] : [];
}

function boxDeclarations(
  props: ResolvedProps<"Box">,
  parent: ParentContext | undefined,
): readonly Declaration[] {
  return [
    ["display", "flex"],
    ["flex-direction", String(props.direction)],
    ...tokenDeclarations("gap", "spacing", props.gap),
    ...paddingDeclarations(props.paddingY, props.paddingX),
    ["align-items", String(props.align)],
    ["justify-content", String(props.justify)],
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
): readonly Declaration[] {
  if (typography === undefined) {
    return [];
  }
  const name = String(typography);
  return TypographyToken.fields().map((field): Declaration => {
    const property = TypographyField.cssProperty(field);
    return [property, TokenCss.typographyRef(name, property)];
  });
}

function textDeclarations(
  props: ResolvedProps<"Text">,
): readonly Declaration[] {
  return [
    ...typographyDeclarations(props.typography),
    ...tokenDeclarations("color", "colors", props.color),
    ["text-align", String(props.align)],
  ];
}

/** 宣言の並び順が入力から一意に決まるため、同じ入力からは常に同じ style になる。 */
function toCssDeclarations(
  declarations: readonly Declaration[],
): CssDeclarations {
  return Object.fromEntries(declarations);
}

function directionOf(props: ResolvedProps<"Box">): Direction {
  return props.direction === "row" ? "row" : "column";
}

function compileText(name: string, props: Props): CompiledElement {
  const resolved = ResolvedProps.resolve("Text", props);
  return {
    kind: "text",
    name,
    style: toCssDeclarations(textDeclarations(resolved)),
    content: String(resolved.content),
  };
}

function compileBox(
  node: ExpandedNode,
  parent: ParentContext | undefined,
): Result<CompiledElement, Error> {
  const resolved = ResolvedProps.resolve("Box", node.props ?? {});
  const childParent: ParentContext = { direction: directionOf(resolved) };
  return Result.map(
    compileNodes(node.children ?? [], childParent),
    (children): CompiledElement => ({
      kind: "box",
      name: node.name,
      style: toCssDeclarations(boxDeclarations(resolved, parent)),
      children,
    }),
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
    return Object.entries(style)
      .map(([property, value]) => `${property}:${value}`)
      .join(";");
  },
} as const;

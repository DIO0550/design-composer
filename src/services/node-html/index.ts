import {
  BoxElement,
  type CompiledElement,
  TextElement,
} from "@/domains/compiled-element";
import type { CssDeclarations, TokenRefs } from "@/domains/css-declaration";
import type { CssDirection } from "@/domains/css-direction";
import type { Props } from "@/domains/node";
import { PrimitiveSchema } from "@/domains/primitive-schema";
import { ResolvedProps } from "@/domains/resolved-props";
import type { ExpandedNode } from "@/services/instance-composition";
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
 * トークン参照の綴り方。カスタムプロパティ名の規則は CSS 出力層が持ち、
 * ドメインへは変換手段として渡す。
 */
const TOKEN_REFS: TokenRefs = {
  ref: TokenCss.ref,
  typographyRef: TokenCss.typographyRef,
};

function compileText(name: string, props: Props): CompiledElement {
  const resolved = ResolvedProps.resolve("Text", props);
  return TextElement.create(
    name,
    TextElement.declarations(resolved, TOKEN_REFS),
    String(resolved.content),
  );
}

function compileBox(
  node: ExpandedNode,
  parent: ParentContext | undefined,
): Result<CompiledElement, Error> {
  const resolved = ResolvedProps.resolve("Box", node.props ?? {});
  const childParent: ParentContext = {
    direction: BoxElement.childDirection(resolved),
  };
  return Result.map(
    compileNodes(node.children ?? [], childParent),
    (children): CompiledElement =>
      BoxElement.create(
        node.name,
        BoxElement.declarations(resolved, parent?.direction, TOKEN_REFS),
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
} as const;

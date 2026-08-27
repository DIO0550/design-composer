import {
  BoxElement,
  type CompiledElement,
  TextElement,
} from "@/domains/compiled/compiled-element";
import type { CssDeclarations } from "@/domains/dcmp/css-declaration";
import type { CssDirection } from "@/domains/dcmp/css-direction";
import type { ExpandedNode } from "@/domains/dcmp/expanded-node";
import type { Props } from "@/domains/dcmp/node";
import { PrimitiveSchema } from "@/domains/dcmp/primitive-schema";
import { ResolvedProps } from "@/domains/dcmp/resolved-props";
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
 * Text をコンパイルする。デフォルトを解決してから宣言と本文を組み立てる。
 *
 * @param name 出力する要素に残すノード名
 * @param props コンパイル対象の props（未設定の分は既定値で埋まる）
 * @returns 宣言と本文を持つコンパイル済み要素
 */
function compileText(name: string, props: Props): CompiledElement {
  const resolved = ResolvedProps.resolve("Text", props);
  return TextElement.create(
    name,
    TextElement.declarations(resolved, TokenCss.refs),
    String(resolved.content),
  );
}

/**
 * Box をコンパイルする。子は自分の向きを親の文脈として受け取る。
 *
 * @param node コンパイル対象の Box ノード
 * @param parent 親の並びの向き。親を持たない位置では `undefined`
 * @returns 子を含むコンパイル済み要素。子のどれかが失敗すればその失敗
 */
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
        BoxElement.declarations(resolved, parent?.direction, TokenCss.refs),
        children,
      ),
  );
}

/**
 * 型で Text / Box へ振り分ける。未知の型は失敗にする。
 *
 * @param node コンパイル対象のノード
 * @param parent 親の並びの向き。親を持たない位置では `undefined`
 * @returns コンパイル済み要素。未知の型なら失敗
 */
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

/**
 * 並びをまとめてコンパイルする。1 つでも失敗したら全体を失敗にする。
 *
 * @param nodes コンパイル対象のノードの並び
 * @param parent 親の並びの向き。親を持たない位置では `undefined`
 * @returns 並び順を保ったコンパイル済み要素。1 つでも失敗すればその失敗
 */
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

/** 展開済みノードを描画できる要素へコンパイルする。 */
export const NodeHtml = {
  /**
   * ノードを `div` + インライン style の要素へコンパイルする。
   * 入力は ref 展開済みのノード (`ExpandedNode.fromNode` の結果)。
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

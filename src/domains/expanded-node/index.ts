import { Component, ComponentSet } from "@/domains/component";
import { Node, type Props } from "@/domains/node";
import { Result } from "@/utils/Result";

/**
 * ref がすべて展開済みであることを構造で保証したノード。
 * children が ExpandedNode のみで構成され、RefNode を含み得ない。
 *
 * ここでの「展開済み（expanded）」は**参照の解決**を指す。`components/` 側の
 * `isExpanded` / `aria-expanded`（ツリーの行が開いているか）とは別の意味。
 */
export type ExpandedNode = Readonly<{
  name: string;
  type: string;
  props?: Props;
  children?: readonly ExpandedNode[];
}>;

/**
 * 展開が失敗する理由。
 * 呼び出し側が種類で分岐できるよう、メッセージ文字列ではなく直和で列挙する。
 *
 * 引けなかった部品名を `ref` ではなく `component` で持つのは、この直和を取り込む
 * `DesignDocumentEditError` の中に `ref`（`TokenRef`）を持つメンバが既にあるため。
 * 同じ綴りで別の型を指すと、フィールド名での絞り込みが型を広げてしまう。
 */
export type ExpandedNodeError =
  | Readonly<{ kind: "component-not-found"; component: string }>
  | Readonly<{ kind: "circular-component-reference"; component: string }>;

export const ExpandedNodeError = {
  /**
   * 診断用の英語メッセージ。
   * 利用者向けの文言は `kind` で分岐して表示層が組み立てる。
   *
   * @param error 綴りたい失敗の理由
   * @returns その理由を表す英語1行
   */
  message(error: ExpandedNodeError): string {
    switch (error.kind) {
      case "component-not-found":
        return `component "${error.component}" not found`;
      case "circular-component-reference":
        return `circular component reference detected at "${error.component}"`;
    }
  },
} as const;

/**
 * 部品インスタンスを定義の中身へ展開する。
 * `expanding` は展開中の部品名で、自分自身へ戻ったら循環参照として失敗にする。
 *
 * @param node 展開対象のノード
 * @param components 参照先の引き先になる部品一式
 * @param expanding ここまでに展開中の部品名（再訪したら循環参照）
 * @returns 展開後のノード。参照先が無い場合と循環参照は失敗
 */
function expandNode(
  node: Node,
  components: ComponentSet,
  expanding: ReadonlySet<string>,
): Result<ExpandedNode, ExpandedNodeError> {
  if (Node.isPrimitive(node)) {
    if (node.children === undefined) {
      return Result.ok({ name: node.name, type: node.type, props: node.props });
    }
    return Result.map(
      expandNodes(node.children, components, expanding),
      (children) => ({
        name: node.name,
        type: node.type,
        props: node.props,
        children,
      }),
    );
  }

  if (expanding.has(node.ref)) {
    return Result.err({
      kind: "circular-component-reference",
      component: node.ref,
    });
  }
  const component = ComponentSet.get(components, node.ref);
  if (component === undefined) {
    return Result.err({ kind: "component-not-found", component: node.ref });
  }
  const overridden = Component.applyOverrides(
    component,
    node.ref,
    node.overrides ?? {},
  );
  const nextExpanding = new Set(expanding).add(node.ref);
  return Result.map(
    expandNodes(overridden.children ?? [], components, nextExpanding),
    (children) => ({
      name: node.name,
      type: overridden.type,
      props: overridden.props,
      children,
    }),
  );
}

/**
 * 並びをまとめて展開する。1 つでも失敗したら全体を失敗にする。
 *
 * @param nodes 展開対象のノードの並び
 * @param components 参照先の引き先になる部品一式
 * @param expanding ここまでに展開中の部品名（再訪したら循環参照）
 * @returns 並び順を保った展開後のノード。1 つでも失敗すればその失敗
 */
function expandNodes(
  nodes: readonly Node[],
  components: ComponentSet,
  expanding: ReadonlySet<string>,
): Result<readonly ExpandedNode[], ExpandedNodeError> {
  const expanded: ExpandedNode[] = [];
  for (const node of nodes) {
    const result = expandNode(node, components, expanding);
    if (!result.ok) {
      return result;
    }
    expanded.push(result.value);
  }
  return Result.ok(expanded);
}

/**
 * 部品インスタンスを定義の中身へ展開する（docs/02-data-model.md「部品参照ノード」）。
 *
 * 生成規則をここに置くのは、`ExpandedNode` が「ref を含み得ない」ことを構造で
 * 保証した型で、その保証を成立させる手続きが展開の走査そのものだから。
 * Why not `Node` 側: 参照先を引くのに `ComponentSet` が要るが、
 * `domains/component` が既に `domains/node` を import しているので循環になる。
 * Why not `ComponentSet` 側: あちらは引き先であって走査の対象ではない。
 */
export const ExpandedNode = {
  /**
   * ノード1つを、参照をすべて解決した形へ作り直す。
   *
   * @param node 展開対象のノード
   * @param components 参照先の引き先になる部品一式
   * @returns 展開後のノード。参照先の部品が無い場合と、参照が循環している場合は失敗
   */
  fromNode(
    node: Node,
    components: ComponentSet,
  ): Result<ExpandedNode, ExpandedNodeError> {
    return expandNode(node, components, new Set());
  },

  /**
   * 並びをまとめて、参照をすべて解決した形へ作り直す。
   *
   * @param nodes 展開対象のノードの並び
   * @param components 参照先の引き先になる部品一式
   * @returns 並び順を保った展開後のノード。1 つでも失敗すればその失敗
   */
  fromNodes(
    nodes: readonly Node[],
    components: ComponentSet,
  ): Result<readonly ExpandedNode[], ExpandedNodeError> {
    return expandNodes(nodes, components, new Set());
  },
} as const;

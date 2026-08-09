import { Component, ComponentSet } from "@/domains/component";
import {
  DesignDocument,
  DesignDocumentEditError,
} from "@/domains/design-document";
import { Node, type Props } from "@/domains/node";
import { Result } from "@/utils/Result";

/**
 * ref がすべて展開済みであることを構造で保証したノード。
 * children が ExpandedNode のみで構成され、RefNode を含み得ない。
 */
export type ExpandedNode = Readonly<{
  name: string;
  type: string;
  props?: Props;
  children?: readonly ExpandedNode[];
}>;

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
): Result<ExpandedNode, Error> {
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
    return Result.err(
      new Error(`circular component reference detected at "${node.ref}"`),
    );
  }
  const component = ComponentSet.get(components, node.ref);
  if (component === undefined) {
    return Result.err(new Error(`component "${node.ref}" not found`));
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
): Result<readonly ExpandedNode[], Error> {
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

/** 部品インスタンスを定義の中身へ展開する（docs/02-data-model.md「部品」）。 */
export const InstanceComposition = {
  expand(node: Node, components: ComponentSet): Result<ExpandedNode, Error> {
    return expandNode(node, components, new Set());
  },

  expandAll(
    nodes: readonly Node[],
    components: ComponentSet,
  ): Result<readonly ExpandedNode[], Error> {
    return expandNodes(nodes, components, new Set());
  },

  detach(
    document: DesignDocument,
    name: string,
  ): Result<DesignDocument, Error> {
    const found = DesignDocument.findNode(document, name);
    if (!found.some) {
      return Result.err(new Error(`node "${name}" not found`));
    }
    const node = found.value;
    if (!Node.isRef(node)) {
      return Result.err(new Error(`node "${name}" is not a ref node`));
    }
    const expandedResult = expandNode(node, document.components, new Set());
    if (!expandedResult.ok) {
      return expandedResult;
    }
    const expanded = expandedResult.value;
    const usedNames = DesignDocument.usedNames(document);
    const children =
      expanded.children === undefined
        ? undefined
        : DesignDocument.renameSubtree(expanded.children, usedNames).nodes;
    const replacement: Node = {
      name: expanded.name,
      type: expanded.type,
      ...(expanded.props !== undefined ? { props: expanded.props } : {}),
      ...(children !== undefined ? { children } : {}),
    };
    return Result.mapErr(
      DesignDocument.replaceNode(document, name, replacement),
      (error) => new Error(DesignDocumentEditError.message(error)),
    );
  },
} as const;

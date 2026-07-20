import { ComponentSet, type PublicProps } from "@/domains/component";
import { DesignDocument } from "@/domains/design-document";
import { Node, type Props, type PropValue } from "@/domains/node";
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

function updateNodeByName(
  nodes: readonly Node[],
  name: string,
  update: (node: Node) => Node,
): readonly Node[] {
  return nodes.map((node) => {
    if (node.name === name) {
      return update(node);
    }
    if (!Node.isPrimitive(node) || node.children === undefined) {
      return node;
    }
    return {
      ...node,
      children: updateNodeByName(node.children, name, update),
    };
  });
}

function applyBindingValue(node: Node, prop: string, value: PropValue): Node {
  if (Node.isRef(node)) {
    return { ...node, overrides: { ...node.overrides, [prop]: value } };
  }
  return { ...node, props: { ...node.props, [prop]: value } };
}

function applyOverrides(
  children: readonly Node[],
  overrides: Props,
  publicProps: PublicProps | undefined,
): readonly Node[] {
  if (publicProps === undefined) {
    return children;
  }
  return Object.entries(overrides).reduce(
    (currentChildren, [propName, value]) => {
      const binding = publicProps[propName];
      if (binding === undefined) {
        return currentChildren;
      }
      return updateNodeByName(currentChildren, binding.node, (target) =>
        applyBindingValue(target, binding.prop, value),
      );
    },
    children,
  );
}

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
  const overridden = applyOverrides(
    component.children ?? [],
    node.overrides ?? {},
    component.publicProps,
  );
  const nextExpanding = new Set(expanding).add(node.ref);
  return Result.map(
    expandNodes(overridden, components, nextExpanding),
    (children) => ({
      name: node.name,
      type: component.type,
      props: component.props,
      children,
    }),
  );
}

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
    return DesignDocument.replaceNode(document, name, replacement);
  },
} as const;

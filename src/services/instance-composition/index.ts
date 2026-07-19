import { ComponentSet, type PublicProps } from "@/domains/component";
import { DesignDocument } from "@/domains/design-document";
import { Node, type Props, type PropValue } from "@/domains/node";

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
): ExpandedNode {
  if (Node.isPrimitive(node)) {
    return {
      name: node.name,
      type: node.type,
      props: node.props,
      children:
        node.children === undefined
          ? undefined
          : expandNodes(node.children, components, expanding),
    };
  }

  if (expanding.has(node.ref)) {
    throw new Error(`circular component reference detected at "${node.ref}"`);
  }
  const component = ComponentSet.get(components, node.ref);
  if (component === undefined) {
    throw new Error(`component "${node.ref}" not found`);
  }
  const overridden = applyOverrides(
    component.children ?? [],
    node.overrides ?? {},
    component.publicProps,
  );
  const nextExpanding = new Set(expanding).add(node.ref);
  return {
    name: node.name,
    type: component.type,
    props: component.props,
    children: expandNodes(overridden, components, nextExpanding),
  };
}

function expandNodes(
  nodes: readonly Node[],
  components: ComponentSet,
  expanding: ReadonlySet<string>,
): readonly ExpandedNode[] {
  return nodes.map((node) => expandNode(node, components, expanding));
}

export const InstanceComposition = {
  expand(node: Node, components: ComponentSet): ExpandedNode {
    return expandNode(node, components, new Set());
  },

  expandAll(
    nodes: readonly Node[],
    components: ComponentSet,
  ): readonly ExpandedNode[] {
    return expandNodes(nodes, components, new Set());
  },

  detach(document: DesignDocument, name: string): DesignDocument {
    const found = DesignDocument.findNode(document, name);
    if (!found.some) {
      throw new Error(`node "${name}" not found`);
    }
    const node = found.value;
    if (!Node.isRef(node)) {
      throw new Error(`node "${name}" is not a ref node`);
    }
    const expanded = expandNode(node, document.components, new Set());
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
    const replaced = DesignDocument.replaceNode(document, name, replacement);
    if (!replaced.ok) {
      throw replaced.error;
    }
    return replaced.value;
  },
} as const;

export type PropValue = string | number | boolean;
export type Props = Readonly<Record<string, PropValue>>;

export type PrimitiveNode = Readonly<{
  name: string;
  type: string;
  props?: Props;
  children?: readonly Node[];
}>;

export type RefNode = Readonly<{
  name: string;
  ref: string;
  overrides?: Props;
}>;

export type Node = PrimitiveNode | RefNode;

export const Node = {
  isRef(node: Node): node is RefNode {
    return "ref" in node;
  },

  isPrimitive(node: Node): node is PrimitiveNode {
    return "type" in node;
  },

  children(node: Node): readonly Node[] {
    return Node.isPrimitive(node) ? (node.children ?? []) : [];
  },

  collectNames(node: Node): readonly string[] {
    return [node.name, ...Node.children(node).flatMap(Node.collectNames)];
  },

  rename(node: Node, renameMap: Readonly<Record<string, string>>): Node {
    const newName = renameMap[node.name] ?? node.name;
    if (Node.isRef(node) || node.children === undefined) {
      return newName === node.name ? node : { ...node, name: newName };
    }
    return {
      ...node,
      name: newName,
      children: node.children.map((child) => Node.rename(child, renameMap)),
    };
  },
} as const;

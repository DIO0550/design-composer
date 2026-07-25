import { Option } from "@/utils/Option";

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

  collectRefs(node: Node): readonly string[] {
    if (Node.isRef(node)) {
      return [node.ref];
    }
    return Node.children(node).flatMap(Node.collectRefs);
  },

  find(node: Node, name: string): Option<Node> {
    if (node.name === name) {
      return Option.some(node);
    }
    for (const child of Node.children(node)) {
      const found = Node.find(child, name);
      if (found.some) {
        return found;
      }
    }
    return Option.none;
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

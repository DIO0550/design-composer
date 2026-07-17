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
} as const;

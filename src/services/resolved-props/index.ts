import type { PrimitiveNode, Props, PropValue } from "@/domains/node";
import {
  PrimitiveSchema,
  type PrimitiveType,
} from "@/domains/primitive-schema";

export const ResolvedProps = {
  resolve(type: PrimitiveType, props: Props): Props {
    const schema = PrimitiveSchema.forType(type);
    const entries = Object.entries(schema.props).flatMap(
      ([name, definition]): (readonly [string, PropValue])[] => {
        if (name in props) {
          return [[name, props[name]]];
        }
        if (definition.default === undefined) {
          return [];
        }
        return [[name, definition.default]];
      },
    );
    return Object.fromEntries(entries);
  },

  forNode(node: PrimitiveNode): Props {
    return ResolvedProps.resolve(node.type as PrimitiveType, node.props ?? {});
  },
} as const;

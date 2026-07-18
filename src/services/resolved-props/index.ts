import type { PrimitiveNode, Props, PropValue } from "@/domains/node";
import {
  type PRIMITIVE_SCHEMAS,
  PrimitiveSchema,
  type PrimitiveType,
  type PropDefinitionRecord,
} from "@/domains/primitive-schema";

type SchemaPropsOf<T extends PrimitiveType> =
  (typeof PRIMITIVE_SCHEMAS)[T]["props"];

type DefaultedKeys<P extends PropDefinitionRecord> = {
  [K in keyof P]: P[K] extends { default: PropValue } ? K : never;
}[keyof P];

/**
 * デフォルト解決済みの props。
 * スキーマでデフォルト値を持つ prop の存在が型レベルで保証される。
 */
export type ResolvedProps<T extends PrimitiveType> = Props &
  Readonly<Record<DefaultedKeys<SchemaPropsOf<T>>, PropValue>>;

export const ResolvedProps = {
  resolve<T extends PrimitiveType>(type: T, props: Props): ResolvedProps<T> {
    const schema: PrimitiveSchema = PrimitiveSchema.forType(type);
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
    // デフォルト持ち prop の補完は上の走査で保証されるため、狭い型への表明は安全
    return Object.fromEntries(entries) as ResolvedProps<T>;
  },

  forNode(node: PrimitiveNode): ResolvedProps<PrimitiveType> {
    return ResolvedProps.resolve(node.type as PrimitiveType, node.props ?? {});
  },
} as const;

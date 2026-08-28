import type { PrimitiveNode, Props, PropValue } from "@/domains/dcmp/node";
import {
  PrimitiveSchema,
  type PrimitiveSchemas,
  type PrimitiveType,
  PropDefinitionRecord,
} from "@/domains/dcmp/primitive-schema";

type SchemaPropsOf<T extends PrimitiveType> =
  (typeof PrimitiveSchemas)[T]["props"];

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
    const declared = Object.keys(schema.props).flatMap(
      (name): (readonly [string, PropValue])[] =>
        name in props ? [[name, props[name]]] : [],
    );
    const defaulted = PropDefinitionRecord.collectDefaultsIfAbsent(
      schema.props,
      props,
    ).map(({ name, value }): readonly [string, PropValue] => [name, value]);
    // デフォルトの上に設定値を重ねる。2 つの走査の条件がずれても明示値が勝つ
    // （`Object.fromEntries` は後勝ち。`session/prop-control` の `effectiveProps` と同じ形）
    const resolved = {
      ...Object.fromEntries(defaulted),
      ...Object.fromEntries(declared),
    };
    // デフォルト持ち prop はどちらかの走査に必ず現れるため、狭い型への表明は安全
    return resolved as ResolvedProps<T>;
  },

  forNode(node: PrimitiveNode): ResolvedProps<PrimitiveType> {
    return ResolvedProps.resolve(node.type as PrimitiveType, node.props ?? {});
  },
} as const;

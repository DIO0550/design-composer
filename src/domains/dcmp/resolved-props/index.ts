import type { PrimitiveNode, Props, PropValue } from "@/domains/dcmp/node";
import {
  PrimitiveSchema,
  type PrimitiveSchemas,
  type PrimitiveType,
  PropDefinitionRecord,
} from "@/domains/dcmp/primitive-schema";
import { Option } from "@/utils/Option";

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
  /**
   * primitive の型のスキーマに照らして、設定されていない prop をデフォルトで補う。
   *
   * @param type 照らすスキーマの primitive の型
   * @param props ノードに設定されている props
   * @returns スキーマが宣言している prop だけの props。設定されていればその値（値がスキーマ
   *   に合うかは見ない）、未設定ならデフォルト。スキーマに無い prop は落とし、デフォルトを
   *   持たない未設定の prop は持たない
   */
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

  /**
   * プリミティブのノードの props を、そのノードの型のスキーマで解決する。
   *
   * @param node 解決するノード。`type` はファイル由来の未知の名前でもよい
   * @returns `resolve` にノードの型と props（未設定なら空）を渡した結果。`type` がスキーマ
   *   に無い（照らすスキーマが引けない）ときは `none`
   */
  forNode(node: PrimitiveNode): Option<ResolvedProps<PrimitiveType>> {
    if (!PrimitiveSchema.isPrimitiveType(node.type)) {
      return Option.none;
    }
    return Option.some(ResolvedProps.resolve(node.type, node.props ?? {}));
  },
} as const;

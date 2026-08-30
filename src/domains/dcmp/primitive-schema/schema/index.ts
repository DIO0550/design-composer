import type { ValueOf } from "@/types/ValueOf";
import { type PropDefinitionRecord, ShorthandNames } from "../prop-definition";

/**
 * primitive の型を名前で指すための対応表。`PrimitiveType` はここから導出し、
 * 二重管理しない。走査するときは `Object.values(PrimitiveTypes)` で並びにする
 * (`token/` の 3 定数と違い、並びを返すコンパニオンの入口をここは持たないため)。
 *
 * Why not: `satisfies` を付けない。`PrimitiveType` を自身から導出しているので
 * `Record<Capitalize<PrimitiveType>, PrimitiveType>` が循環する。代わりに
 * **キーの綴りと過不足**は `__tests__/schema.type.test.ts` の型テストが、
 * **値**が 2 種類に閉じていることは `__tests__/schema.edge.test.ts` が押さえる。
 */
export const PrimitiveTypes = {
  Box: "Box",
  Text: "Text",
} as const;

/** 組み込みで用意されているノードの型（docs/02「プリミティブ」）。 */
export type PrimitiveType = ValueOf<typeof PrimitiveTypes>;

/** 1つの primitive の仕様。子を持てるかと、受け付ける props を宣言する。 */
export type PrimitiveSchema = Readonly<{
  allowsChildren: boolean;
  props: PropDefinitionRecord;
}>;

/**
 * 親の中でのノードの置かれ方を決める props（docs/03「配置の指定」）。
 * Box と Text のどちらも親の中に置かれるので、同じ 3 prop を両方が持つ。
 *
 * 座標に既定 `0` を置くのは、「絶対配置なのに座標が無い」を作れなくするため。
 * 既定はファイルに書き出されない（docs/02「明示的に設定した props のみを保存する」）
 * ので、書いていないノードの diff には現れない。
 */
const PlacementProps = {
  placement: {
    domain: "enum",
    values: ["flow", "absolute"],
    default: "flow",
    group: "layout",
  },
  x: {
    domain: "literal",
    literalType: "number",
    default: 0,
    group: "layout",
    enabledWhen: { prop: "placement", equals: "absolute" },
  },
  y: {
    domain: "literal",
    literalType: "number",
    default: 0,
    group: "layout",
    enabledWhen: { prop: "placement", equals: "absolute" },
  },
} as const satisfies PropDefinitionRecord;

/**
 * Box の仕様（docs/02「プリミティブ」の表）。
 * `as const satisfies` で書くのは、`PrimitiveSchema` への適合を検査しつつ
 * prop 名・`tokenKind`・デフォルト値をリテラル型のまま残すため
 * （`token-props/` の型レベルの導出がこの情報に依存している）。
 */
export const BoxSchema = {
  allowsChildren: true,
  props: {
    ...PlacementProps,
    direction: {
      domain: "enum",
      values: ["row", "column"],
      default: "column",
      group: "layout",
    },
    gap: { domain: "token", tokenKind: "spacing", group: "layout" },
    paddingTop: {
      domain: "token",
      tokenKind: "spacing",
      group: "layout",
      shorthand: { name: ShorthandNames.Padding, side: "top" },
    },
    paddingRight: {
      domain: "token",
      tokenKind: "spacing",
      group: "layout",
      shorthand: { name: ShorthandNames.Padding, side: "right" },
    },
    paddingBottom: {
      domain: "token",
      tokenKind: "spacing",
      group: "layout",
      shorthand: { name: ShorthandNames.Padding, side: "bottom" },
    },
    paddingLeft: {
      domain: "token",
      tokenKind: "spacing",
      group: "layout",
      shorthand: { name: ShorthandNames.Padding, side: "left" },
    },
    align: {
      domain: "enum",
      values: ["start", "center", "end", "stretch"],
      default: "stretch",
      group: "layout",
    },
    justify: {
      domain: "enum",
      values: ["start", "center", "end", "space-between"],
      default: "start",
      group: "layout",
    },
    widthMode: {
      domain: "enum",
      values: ["hug", "fill", "fixed"],
      default: "hug",
      group: "size",
    },
    width: {
      domain: "literal",
      literalType: "number",
      group: "size",
      enabledWhen: { prop: "widthMode", equals: "fixed" },
    },
    heightMode: {
      domain: "enum",
      values: ["hug", "fill", "fixed"],
      default: "hug",
      group: "size",
    },
    height: {
      domain: "literal",
      literalType: "number",
      group: "size",
      enabledWhen: { prop: "heightMode", equals: "fixed" },
    },
    background: { domain: "token", tokenKind: "colors", group: "appearance" },
    radius: { domain: "token", tokenKind: "radius", group: "appearance" },
    shadow: { domain: "token", tokenKind: "shadows", group: "appearance" },
    overflow: {
      domain: "enum",
      values: ["visible", "clip"],
      default: "visible",
      group: "appearance",
    },
  },
} as const satisfies PrimitiveSchema;

/** Text の仕様（docs/02 の表）。子は持たず、文言と見た目だけを持つ。 */
export const TextSchema = {
  allowsChildren: false,
  props: {
    ...PlacementProps,
    content: {
      domain: "literal",
      literalType: "string",
      default: "",
      group: "content",
    },
    typography: {
      domain: "token",
      tokenKind: "typography",
      default: "body",
      group: "appearance",
    },
    color: {
      domain: "token",
      tokenKind: "colors",
      default: "gray-900",
      group: "appearance",
    },
    align: {
      domain: "enum",
      values: ["left", "center", "right"],
      default: "left",
      group: "appearance",
    },
  },
} as const satisfies PrimitiveSchema;

/** primitive の型 → その仕様。型を取り違えた引き当てにならないよう対応で持つ。 */
export const PrimitiveSchemas = {
  Box: BoxSchema,
  Text: TextSchema,
} as const satisfies Readonly<Record<PrimitiveType, PrimitiveSchema>>;

export const PrimitiveSchema = {
  /**
   * その primitive のスキーマ。
   * 戻り値を `PrimitiveSchema` へ広げず型引数で受けるのは、
   * 呼び出し側が prop 名やデフォルト値をリテラル型のまま扱えるようにするため。
   */
  forType<T extends PrimitiveType>(type: T): (typeof PrimitiveSchemas)[T] {
    return PrimitiveSchemas[type];
  },

  /** その名前が primitive の型か（ファイル由来の未知の type を弾く境界）。 */
  isPrimitiveType(type: string): type is PrimitiveType {
    return (Object.values(PrimitiveTypes) as readonly string[]).includes(type);
  },

  /**
   * その type のノードが子を持てるか。
   * primitive でない type は子を持てない扱いにする（未知の type に子を挿せない）。
   */
  allowsChildren(type: string): boolean {
    return (
      PrimitiveSchema.isPrimitiveType(type) &&
      PrimitiveSchemas[type].allowsChildren
    );
  },
} as const;

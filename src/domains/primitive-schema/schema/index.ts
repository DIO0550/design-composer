import type { PropDefinitionRecord } from "../prop-definition";

/** 走査に使う実行時のリスト。`PrimitiveType` はここから導出し、二重管理しない。 */
export const PrimitiveTypes = ["Box", "Text"] as const;

/** 組み込みで用意されているノードの型（docs/02「プリミティブ」）。 */
export type PrimitiveType = (typeof PrimitiveTypes)[number];

/** 1つの primitive の仕様。子を持てるかと、受け付ける props を宣言する。 */
export type PrimitiveSchema = Readonly<{
  allowsChildren: boolean;
  props: PropDefinitionRecord;
}>;

/**
 * Box の仕様（docs/02「プリミティブ」の表）。
 * `as const satisfies` で書くのは、`PrimitiveSchema` への適合を検査しつつ
 * prop 名・`tokenKind`・デフォルト値をリテラル型のまま残すため
 * （`token-props/` の型レベルの導出がこの情報に依存している）。
 */
export const BoxSchema = {
  allowsChildren: true,
  props: {
    direction: {
      domain: "enum",
      values: ["row", "column"],
      default: "column",
      group: "layout",
    },
    gap: { domain: "token", tokenKind: "spacing", group: "layout" },
    paddingX: { domain: "token", tokenKind: "spacing", group: "layout" },
    paddingY: { domain: "token", tokenKind: "spacing", group: "layout" },
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
    return (PrimitiveTypes as readonly string[]).includes(type);
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

import { type PropAssignment, Props, type PropValue } from "@/domains/node";
import type { TokenKind } from "@/domains/token";
import { TokenSet } from "@/domains/token";

export const PRIMITIVE_TYPES = ["Box", "Text"] as const;
export type PrimitiveType = (typeof PRIMITIVE_TYPES)[number];

export type EnabledWhen = Readonly<{
  prop: string;
  equals: PropValue;
}>;

type PropDefinitionBase = Readonly<{
  default?: PropValue;
  group: string;
  enabledWhen?: EnabledWhen;
}>;

export type EnumPropDefinition = PropDefinitionBase &
  Readonly<{
    domain: "enum";
    values: readonly string[];
  }>;

export type TokenPropDefinition = PropDefinitionBase &
  Readonly<{
    domain: "token";
    tokenKind: TokenKind;
  }>;

export type LiteralPropDefinition = PropDefinitionBase &
  Readonly<{
    domain: "literal";
    literalType: "number" | "string";
  }>;

export type PropDefinition =
  | EnumPropDefinition
  | TokenPropDefinition
  | LiteralPropDefinition;

export type PropDefinitionRecord = Readonly<Record<string, PropDefinition>>;

export type PropValidationErrorKind =
  | "unknown-prop"
  | "enum-violation"
  | "literal-type-mismatch"
  | "dangling-token";

export type PropValidationError = Readonly<{
  kind: PropValidationErrorKind;
  prop: string;
  message: string;
}>;

export const PropDefinition = {
  isEnum(definition: PropDefinition): definition is EnumPropDefinition {
    return definition.domain === "enum";
  },

  isToken(definition: PropDefinition): definition is TokenPropDefinition {
    return definition.domain === "token";
  },

  isLiteral(definition: PropDefinition): definition is LiteralPropDefinition {
    return definition.domain === "literal";
  },

  isEnabled(
    definition: PropDefinition,
    props: Readonly<Record<string, PropValue>>,
  ): boolean {
    if (!definition.enabledWhen) {
      return true;
    }
    return props[definition.enabledWhen.prop] === definition.enabledWhen.equals;
  },

  collectErrors(
    definition: PropDefinition,
    assignment: PropAssignment,
    tokens: TokenSet,
  ): readonly PropValidationError[] {
    const { name, value } = assignment;

    if (PropDefinition.isEnum(definition)) {
      if (typeof value === "string" && definition.values.includes(value)) {
        return [];
      }
      return [
        {
          kind: "enum-violation",
          prop: name,
          message: `prop "${name}" must be one of ${definition.values.join(", ")}`,
        },
      ];
    }

    if (PropDefinition.isLiteral(definition)) {
      if (typeof value === definition.literalType) {
        return [];
      }
      return [
        {
          kind: "literal-type-mismatch",
          prop: name,
          message: `prop "${name}" must be of type ${definition.literalType}`,
        },
      ];
    }

    if (
      typeof value === "string" &&
      TokenSet.has(tokens, definition.tokenKind, value)
    ) {
      return [];
    }
    return [
      {
        kind: "dangling-token",
        prop: name,
        message: `prop "${name}" references unknown ${definition.tokenKind} token "${String(value)}"`,
      },
    ];
  },
} as const;

export const PropDefinitionRecord = {
  propNames(schema: PropDefinitionRecord): readonly string[] {
    return Object.keys(schema);
  },

  collectErrors(
    schema: PropDefinitionRecord,
    props: Props,
    tokens: TokenSet,
  ): readonly PropValidationError[] {
    return Props.toAssignments(props).flatMap((assignment) => {
      const definition = schema[assignment.name];
      if (definition === undefined) {
        return [
          {
            kind: "unknown-prop" as const,
            prop: assignment.name,
            message: `unknown prop "${assignment.name}"`,
          },
        ];
      }
      return PropDefinition.collectErrors(definition, assignment, tokens);
    });
  },
} as const;

export type PrimitiveSchema = Readonly<{
  allowsChildren: boolean;
  props: PropDefinitionRecord;
}>;

export const BOX_SCHEMA = {
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

export const TEXT_SCHEMA = {
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

export const PRIMITIVE_SCHEMAS = {
  Box: BOX_SCHEMA,
  Text: TEXT_SCHEMA,
} as const satisfies Readonly<Record<PrimitiveType, PrimitiveSchema>>;

type SchemaPropsOf<T extends PrimitiveType> =
  (typeof PRIMITIVE_SCHEMAS)[T]["props"];

type TokenPropNameOf<T extends PrimitiveType> = {
  [K in keyof SchemaPropsOf<T>]: SchemaPropsOf<T>[K] extends { domain: "token" }
    ? K
    : never;
}[keyof SchemaPropsOf<T>];

/**
 * スキーマが `domain: "token"` と宣言した prop の名前。
 * 名前は primitive をまたいで重複しないため、型を問わず名前だけで引ける。
 */
export type TokenPropName = {
  [T in PrimitiveType]: TokenPropNameOf<T>;
}[PrimitiveType];

type TokenKindOfProp<P extends TokenPropName> = Extract<
  SchemaPropsOf<PrimitiveType>,
  Readonly<Record<P, TokenPropDefinition>>
>[P]["tokenKind"];

/**
 * トークン参照 prop → 引くトークン種別。スキーマの `tokenKind` から導出するので、
 * 種別の宣言はスキーマだけが持つ（対応表を別に書き写して二重管理しない）。
 */
export type TokenPropKinds = {
  readonly [P in TokenPropName]: TokenKindOfProp<P>;
};

// スキーマの宣言をそのまま集めているため、狭い型への表明はここで成立している
const TOKEN_PROP_KINDS = Object.fromEntries(
  Object.values(PRIMITIVE_SCHEMAS).flatMap((schema: PrimitiveSchema) =>
    Object.entries(schema.props).flatMap(([name, definition]) =>
      PropDefinition.isToken(definition)
        ? [[name, definition.tokenKind] as const]
        : [],
    ),
  ),
) as TokenPropKinds;

export const PrimitiveSchema = {
  forType<T extends PrimitiveType>(type: T): (typeof PRIMITIVE_SCHEMAS)[T] {
    return PRIMITIVE_SCHEMAS[type];
  },

  isPrimitiveType(type: string): type is PrimitiveType {
    return (PRIMITIVE_TYPES as readonly string[]).includes(type);
  },

  allowsChildren(type: string): boolean {
    return (
      PrimitiveSchema.isPrimitiveType(type) &&
      PRIMITIVE_SCHEMAS[type].allowsChildren
    );
  },

  /**
   * トークン参照 prop が引くトークン種別。
   * 出力側が「どの種別から引くか」を書き写さずに済むよう、スキーマの宣言を引かせる。
   */
  tokenKind<P extends TokenPropName>(prop: P): TokenPropKinds[P] {
    return TOKEN_PROP_KINDS[prop];
  },
} as const;

import type { PropValue } from "@/domains/node";
import type { TokenKind } from "@/domains/token";

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
} as const;

export const PropDefinitionRecord = {
  propNames(schema: PropDefinitionRecord): readonly string[] {
    return Object.keys(schema);
  },
} as const;

export type PrimitiveSchema = Readonly<{
  allowsChildren: boolean;
  props: PropDefinitionRecord;
}>;

export const BOX_SCHEMA: PrimitiveSchema = {
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
  } satisfies PropDefinitionRecord,
};

export const TEXT_SCHEMA: PrimitiveSchema = {
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
  } satisfies PropDefinitionRecord,
};

export const PRIMITIVE_SCHEMAS: Readonly<
  Record<PrimitiveType, PrimitiveSchema>
> = {
  Box: BOX_SCHEMA,
  Text: TEXT_SCHEMA,
};

export const PrimitiveSchema = {
  forType(type: PrimitiveType): PrimitiveSchema {
    return PRIMITIVE_SCHEMAS[type];
  },
} as const;

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

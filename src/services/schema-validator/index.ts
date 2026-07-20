import { ComponentSet } from "@/domains/component";
import type { DesignDocument } from "@/domains/design-document";
import type { Props, PropValue } from "@/domains/node";
import { Node } from "@/domains/node";
import type { PropDefinitionRecord } from "@/domains/primitive-schema";
import {
  BOX_SCHEMA,
  PrimitiveSchema,
  PropDefinition,
} from "@/domains/primitive-schema";
import { TokenSet } from "@/domains/token";

export type SchemaValidationErrorKind =
  | "unknown-type"
  | "unknown-prop"
  | "enum-violation"
  | "literal-type-mismatch"
  | "dangling-token";

export type SchemaValidationError = Readonly<{
  kind: SchemaValidationErrorKind;
  nodeName: string;
  prop?: string;
  message: string;
}>;

function validatePropValue(
  nodeName: string,
  propName: string,
  definition: PropDefinition,
  value: PropValue,
  tokens: TokenSet,
): readonly SchemaValidationError[] {
  if (PropDefinition.isEnum(definition)) {
    if (typeof value === "string" && definition.values.includes(value)) {
      return [];
    }
    return [
      {
        kind: "enum-violation",
        nodeName,
        prop: propName,
        message: `prop "${propName}" must be one of ${definition.values.join(", ")}`,
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
        nodeName,
        prop: propName,
        message: `prop "${propName}" must be of type ${definition.literalType}`,
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
      nodeName,
      prop: propName,
      message: `prop "${propName}" references unknown ${definition.tokenKind} token "${String(value)}"`,
    },
  ];
}

function validatePropsAgainstSchema(
  nodeName: string,
  schemaProps: PropDefinitionRecord,
  props: Props,
  tokens: TokenSet,
): readonly SchemaValidationError[] {
  return Object.entries(props).flatMap(([propName, value]) => {
    const definition = schemaProps[propName];
    if (definition === undefined) {
      return [
        {
          kind: "unknown-prop" as const,
          nodeName,
          prop: propName,
          message: `unknown prop "${propName}"`,
        },
      ];
    }
    return validatePropValue(nodeName, propName, definition, value, tokens);
  });
}

function validateTypedProps(
  nodeName: string,
  type: string,
  props: Props | undefined,
  tokens: TokenSet,
): readonly SchemaValidationError[] {
  if (!PrimitiveSchema.isPrimitiveType(type)) {
    return [
      {
        kind: "unknown-type",
        nodeName,
        message: `unknown type "${type}"`,
      },
    ];
  }
  const schema = PrimitiveSchema.forType(type);
  return validatePropsAgainstSchema(
    nodeName,
    schema.props,
    props ?? {},
    tokens,
  );
}

function validateNode(
  node: Node,
  tokens: TokenSet,
): readonly SchemaValidationError[] {
  if (Node.isRef(node)) {
    return [];
  }
  return [
    ...validateTypedProps(node.name, node.type, node.props, tokens),
    ...Node.children(node).flatMap((child) => validateNode(child, tokens)),
  ];
}

export const SchemaValidator = {
  validate(document: DesignDocument): readonly SchemaValidationError[] {
    const componentErrors = ComponentSet.names(document.components).flatMap(
      (name) => {
        const component = ComponentSet.get(document.components, name);
        if (component === undefined) {
          return [];
        }
        return [
          ...validateTypedProps(
            name,
            component.type,
            component.props,
            document.tokens,
          ),
          ...(component.children ?? []).flatMap((child) =>
            validateNode(child, document.tokens),
          ),
        ];
      },
    );

    const artboardErrors = document.artboards.flatMap((artboard) => [
      ...validatePropsAgainstSchema(
        artboard.name,
        BOX_SCHEMA.props,
        artboard.props ?? {},
        document.tokens,
      ),
      ...artboard.children.flatMap((child) =>
        validateNode(child, document.tokens),
      ),
    ]);

    return [...componentErrors, ...artboardErrors];
  },
} as const;

import { ComponentSet } from "@/domains/component";
import type { DesignDocument } from "@/domains/design-document";
import type { Props } from "@/domains/node";
import { Node } from "@/domains/node";
import type { PropValidationError } from "@/domains/primitive-schema";
import {
  BOX_SCHEMA,
  PrimitiveSchema,
  PropDefinitionRecord,
} from "@/domains/primitive-schema";
import type { TokenSet } from "@/domains/token";

export type SchemaValidationErrorKind =
  | PropValidationError["kind"]
  | "unknown-type";

export type SchemaValidationError = Readonly<{
  kind: SchemaValidationErrorKind;
  nodeName: string;
  prop?: string;
  message: string;
}>;

function toSchemaValidationErrors(
  nodeName: string,
  errors: readonly PropValidationError[],
): readonly SchemaValidationError[] {
  return errors.map((error) => ({ ...error, nodeName }));
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
  return toSchemaValidationErrors(
    nodeName,
    PropDefinitionRecord.validate(schema.props, props ?? {}, tokens),
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
      ...toSchemaValidationErrors(
        artboard.name,
        PropDefinitionRecord.validate(
          BOX_SCHEMA.props,
          artboard.props ?? {},
          document.tokens,
        ),
      ),
      ...artboard.children.flatMap((child) =>
        validateNode(child, document.tokens),
      ),
    ]);

    return [...componentErrors, ...artboardErrors];
  },
} as const;

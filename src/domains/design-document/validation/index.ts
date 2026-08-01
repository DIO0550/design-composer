import type { Artboard } from "@/domains/artboard";
import {
  Component,
  ComponentSet,
  type PublicPropBinding,
} from "@/domains/component";
import { ComponentBinding } from "@/domains/component-binding";
import { Node, Props, type RefNode } from "@/domains/node";
import type { PropValidationError } from "@/domains/primitive-schema";
import {
  BOX_SCHEMA,
  PrimitiveSchema,
  PropDefinition,
  PropDefinitionRecord,
} from "@/domains/primitive-schema";
import { TokenSet } from "@/domains/token";
import { collectAllNames, isValidIdentifier } from "../naming";
import type { DesignDocumentV1 as DesignDocument } from "../v1";

export type DesignDocumentValidationErrorKind =
  | PropValidationError["kind"]
  | "unknown-type"
  | "dangling-ref"
  | "circular-ref"
  | "undeclared-override"
  | "dangling-binding-node"
  | "dangling-binding-prop"
  | "missing-name"
  | "invalid-identifier"
  | "duplicate-name";

export type DesignDocumentValidationError = Readonly<{
  kind: DesignDocumentValidationErrorKind;
  nodeName: string;
  prop?: string;
  message: string;
}>;

/**
 * 発生位置（nodeName / prop）を持たないエラー。
 * 位置は検出側ではなく、その位置を知っている呼び出し側で付与する。
 */
type UnlocatedError = Readonly<{
  kind: DesignDocumentValidationErrorKind;
  prop?: string;
  message: string;
}>;

/** エラーの発生位置。 */
type ErrorLocation = Readonly<{
  nodeName: string;
  prop?: string;
}>;

/** 位置を持たないエラーに発生位置を付与し、報告用のエラーに変換する。 */
function withLocation(
  location: ErrorLocation,
  errors: readonly UnlocatedError[],
): readonly DesignDocumentValidationError[] {
  return errors.map((error) => {
    const prop = error.prop ?? location.prop;
    return {
      kind: error.kind,
      nodeName: location.nodeName,
      ...(prop !== undefined ? { prop } : {}),
      message: error.message,
    };
  });
}

function collectTypedPropErrors(
  type: string,
  props: Props | undefined,
  tokens: TokenSet,
): readonly UnlocatedError[] {
  if (!PrimitiveSchema.isPrimitiveType(type)) {
    return [{ kind: "unknown-type", message: `unknown type "${type}"` }];
  }
  const schema = PrimitiveSchema.forType(type);
  return PropDefinitionRecord.collectErrors(schema.props, props ?? {}, tokens);
}

function collectNodeErrors(
  node: Node,
  tokens: TokenSet,
): readonly DesignDocumentValidationError[] {
  if (Node.isRef(node)) {
    return [];
  }
  const ownErrors = withLocation(
    { nodeName: node.name },
    collectTypedPropErrors(node.type, node.props, tokens),
  );
  const childErrors = Node.children(node).flatMap((child) =>
    collectNodeErrors(child, tokens),
  );
  return [...ownErrors, ...childErrors];
}

/** 参照検証が横断的に必要とする、ドキュメント全体の文脈。 */
type ReferenceContext = Readonly<{
  components: ComponentSet;
  tokens: TokenSet;
}>;

function collectOverrideErrors(
  context: ReferenceContext,
  refNode: RefNode,
  component: Component,
): readonly UnlocatedError[] {
  return Props.toAssignments(refNode.overrides ?? {}).flatMap(
    (assignment): readonly UnlocatedError[] => {
      const binding = Component.binding(component, assignment.name);
      if (!binding.some) {
        return [
          {
            kind: "undeclared-override" as const,
            prop: assignment.name,
            message: `component "${refNode.ref}" does not declare public prop "${assignment.name}"`,
          },
        ];
      }
      const definition = ComponentBinding.resolvePropDefinition(
        context.components,
        ComponentBinding.create(refNode.ref, binding.value),
      );
      if (!definition.some) {
        return [];
      }
      return PropDefinition.collectErrors(
        definition.value,
        assignment,
        context.tokens,
      );
    },
  );
}

function collectRefNodeErrors(
  context: ReferenceContext,
  refNode: RefNode,
): readonly UnlocatedError[] {
  const component = ComponentSet.get(context.components, refNode.ref);
  if (component === undefined) {
    return [
      {
        kind: "dangling-ref",
        message: `unknown component "${refNode.ref}"`,
      },
    ];
  }
  return collectOverrideErrors(context, refNode, component);
}

function collectNodeRefErrors(
  context: ReferenceContext,
  node: Node,
): readonly DesignDocumentValidationError[] {
  if (Node.isRef(node)) {
    return withLocation(
      { nodeName: node.name },
      collectRefNodeErrors(context, node),
    );
  }
  return Node.children(node).flatMap((child) =>
    collectNodeRefErrors(context, child),
  );
}

function collectBindingTargetErrors(
  context: ReferenceContext,
  binding: PublicPropBinding,
  target: Node,
): readonly UnlocatedError[] {
  if (Node.isRef(target)) {
    const nested = ComponentSet.get(context.components, target.ref);
    if (nested === undefined || Component.isPublicProp(nested, binding.prop)) {
      return [];
    }
    return [
      {
        kind: "dangling-binding-prop",
        message: `"${binding.prop}" is not a public prop of component "${target.ref}"`,
      },
    ];
  }
  if (!PrimitiveSchema.isPrimitiveType(target.type)) {
    return [];
  }
  const schema: PrimitiveSchema = PrimitiveSchema.forType(target.type);
  if (binding.prop in schema.props) {
    return [];
  }
  return [
    {
      kind: "dangling-binding-prop",
      message: `node "${binding.node}" has no prop "${binding.prop}"`,
    },
  ];
}

function collectBindingErrors(
  context: ReferenceContext,
  componentName: string,
  component: Component,
): readonly DesignDocumentValidationError[] {
  return Component.publicPropNames(component).flatMap((publicPropName) => {
    const binding = Component.binding(component, publicPropName);
    if (!binding.some) {
      return [];
    }
    const location: ErrorLocation = {
      nodeName: componentName,
      prop: publicPropName,
    };
    const found = Component.findNode(
      component,
      componentName,
      binding.value.node,
    );
    if (!found.some) {
      return withLocation(location, [
        {
          kind: "dangling-binding-node",
          message: `unknown node "${binding.value.node}"`,
        },
      ]);
    }
    return withLocation(
      location,
      collectBindingTargetErrors(context, binding.value, found.value),
    );
  });
}

/** 部品どうしの参照が輪になっているものを報告する。 */
function collectCircularRefErrors(
  components: ComponentSet,
): readonly DesignDocumentValidationError[] {
  return ComponentSet.circularNames(components).map((name) => ({
    kind: "circular-ref" as const,
    nodeName: name,
    message: `component "${name}" is part of a circular reference`,
  }));
}

/** 部品1件の props・子ノード・binding・参照のエラーを集める。 */
function collectComponentErrors(
  context: ReferenceContext,
  name: string,
  component: Component,
): readonly DesignDocumentValidationError[] {
  const children = component.children ?? [];
  const propErrors = withLocation(
    { nodeName: name },
    collectTypedPropErrors(component.type, component.props, context.tokens),
  );
  const childErrors = children.flatMap((child) =>
    collectNodeErrors(child, context.tokens),
  );
  const bindingErrors = collectBindingErrors(context, name, component);
  const refErrors = children.flatMap((child) =>
    collectNodeRefErrors(context, child),
  );
  return [...propErrors, ...childErrors, ...bindingErrors, ...refErrors];
}

/** artboard 1件の props・子ノード・参照のエラーを集める。 */
function collectArtboardErrors(
  context: ReferenceContext,
  artboard: Artboard,
): readonly DesignDocumentValidationError[] {
  const propErrors = withLocation(
    { nodeName: artboard.name },
    PropDefinitionRecord.collectErrors(
      BOX_SCHEMA.props,
      artboard.props ?? {},
      context.tokens,
    ),
  );
  const childErrors = artboard.children.flatMap((child) =>
    collectNodeErrors(child, context.tokens),
  );
  const refErrors = artboard.children.flatMap((child) =>
    collectNodeRefErrors(context, child),
  );
  return [...propErrors, ...childErrors, ...refErrors];
}

/** 2回以上現れる名前を、最初に現れた順で1つずつ返す。 */
function duplicatedNames(names: readonly string[]): readonly string[] {
  return names.filter(
    (name, index) =>
      names.indexOf(name) === index && names.lastIndexOf(name) !== index,
  );
}

function collectDuplicateNameErrors(
  document: DesignDocument,
): readonly DesignDocumentValidationError[] {
  return duplicatedNames(collectAllNames(document)).map(
    (name): DesignDocumentValidationError => ({
      kind: "duplicate-name",
      nodeName: name,
      message: `name "${name}" is not unique in the document`,
    }),
  );
}

/**
 * 名前1つを検証する。
 * 名前が欠落している場合は自身の名前で位置を示せないため、
 * その名前を含む入れ物（`ownerName`）と入れ物内での位置（`position`）を引数で受け取る。
 */
function collectNameErrors(
  name: string,
  ownerName: string,
  position: string,
): readonly DesignDocumentValidationError[] {
  if (!name) {
    return [
      {
        kind: "missing-name",
        nodeName: ownerName,
        message: `${position} of "${ownerName}" has no name`,
      },
    ];
  }
  if (!isValidIdentifier(name)) {
    return [
      {
        kind: "invalid-identifier",
        nodeName: name,
        message: `name "${name}" is not a valid identifier`,
      },
    ];
  }
  return [];
}

function collectNodeNameErrors(
  nodes: readonly Node[],
  ownerName: string,
): readonly DesignDocumentValidationError[] {
  return nodes.flatMap((node, index) => [
    ...collectNameErrors(node.name, ownerName, `child ${index}`),
    ...collectNodeNameErrors(Node.children(node), node.name || ownerName),
  ]);
}

function collectTokenNameErrors(
  tokens: TokenSet,
): readonly DesignDocumentValidationError[] {
  return TokenSet.kinds().flatMap((kind) =>
    TokenSet.names(tokens, kind).flatMap(
      (name): readonly DesignDocumentValidationError[] =>
        isValidIdentifier(name)
          ? []
          : [
              {
                kind: "invalid-identifier",
                nodeName: name,
                message: `token name "${name}" in ${kind} is not a valid identifier`,
              },
            ],
    ),
  );
}

/** ドキュメント全体の名前（部品・artboard・ノード・トークン）のエラーを集める。 */
function collectDocumentNameErrors(
  document: DesignDocument,
): readonly DesignDocumentValidationError[] {
  const componentErrors = ComponentSet.names(document.components).flatMap(
    (name): readonly DesignDocumentValidationError[] => {
      const component = ComponentSet.get(document.components, name);
      return [
        ...collectNameErrors(name, "components", `key "${name}"`),
        ...collectNodeNameErrors(component?.children ?? [], name),
      ];
    },
  );
  const artboardErrors = document.artboards.flatMap(
    (artboard, index): readonly DesignDocumentValidationError[] => [
      ...collectNameErrors(artboard.name, "artboards", `artboard ${index}`),
      ...collectNodeNameErrors(artboard.children, artboard.name),
    ],
  );
  return [
    ...componentErrors,
    ...artboardErrors,
    ...collectDuplicateNameErrors(document),
    ...collectTokenNameErrors(document.tokens),
  ];
}

/**
 * ドキュメントが仕様に適合しない箇所をすべて集める。
 * 最初の1件で止めないのは、不正なファイルのエラー一覧を出せるようにするため。
 */
export function collectErrors(
  document: DesignDocument,
): readonly DesignDocumentValidationError[] {
  const context: ReferenceContext = {
    components: document.components,
    tokens: document.tokens,
  };

  const componentErrors = ComponentSet.names(document.components).flatMap(
    (name) => {
      const component = ComponentSet.get(document.components, name);
      if (component === undefined) {
        return [];
      }
      return collectComponentErrors(context, name, component);
    },
  );
  const artboardErrors = document.artboards.flatMap((artboard) =>
    collectArtboardErrors(context, artboard),
  );
  const circularErrors = collectCircularRefErrors(document.components);
  const nameErrors = collectDocumentNameErrors(document);

  return [
    ...componentErrors,
    ...artboardErrors,
    ...circularErrors,
    ...nameErrors,
  ];
}

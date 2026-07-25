import type { Artboard } from "@/domains/artboard";
import {
  Component,
  ComponentSet,
  type PublicPropBinding,
} from "@/domains/component";
import {
  FormatVersion,
  type FormatVersionCompatibility,
} from "@/domains/format-version";
import { Node, type Props, type RefNode } from "@/domains/node";
import type { PropValidationError } from "@/domains/primitive-schema";
import {
  BOX_SCHEMA,
  PrimitiveSchema,
  PropDefinition,
  PropDefinitionRecord,
} from "@/domains/primitive-schema";
import { TokenSet } from "@/domains/token";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

export type DesignDocument = Readonly<{
  formatVersion: FormatVersion;
  tokens: TokenSet;
  components: ComponentSet;
  artboards: readonly Artboard[];
}>;

export type DesignDocumentValidationErrorKind =
  | PropValidationError["kind"]
  | "unknown-type"
  | "dangling-ref"
  | "circular-ref"
  | "undeclared-override"
  | "dangling-binding-node"
  | "dangling-binding-prop";

export type DesignDocumentValidationError = Readonly<{
  kind: DesignDocumentValidationErrorKind;
  nodeName: string;
  prop?: string;
  message: string;
}>;

function canNodeHaveChildren(node: Node): boolean {
  return Node.isPrimitive(node) && PrimitiveSchema.allowsChildren(node.type);
}

type ArrayUpdate = (children: readonly Node[]) => readonly Node[];

function updateChildrenOfNode(
  nodes: readonly Node[],
  parentName: string,
  update: ArrayUpdate,
): { updated: readonly Node[]; found: boolean } {
  let found = false;
  const updated = nodes.map((node) => {
    if (found) {
      return node;
    }
    if (node.name === parentName) {
      if (!canNodeHaveChildren(node)) {
        throw new Error(`node "${parentName}" cannot have children`);
      }
      found = true;
      return { ...node, children: update(Node.children(node)) };
    }
    const children = Node.children(node);
    if (children.length === 0) {
      return node;
    }
    const result = updateChildrenOfNode(children, parentName, update);
    if (result.found) {
      found = true;
      return { ...node, children: result.updated };
    }
    return node;
  });
  return { updated, found };
}

function updateChildrenOfParent(
  artboards: readonly Artboard[],
  parentName: string,
  update: ArrayUpdate,
): { artboards: readonly Artboard[]; found: boolean } {
  let found = false;
  const updated = artboards.map((artboard) => {
    if (found) {
      return artboard;
    }
    if (artboard.name === parentName) {
      found = true;
      return { ...artboard, children: update(artboard.children) };
    }
    const result = updateChildrenOfNode(artboard.children, parentName, update);
    if (result.found) {
      found = true;
      return { ...artboard, children: result.updated };
    }
    return artboard;
  });
  return { artboards: updated, found };
}

function updateSiblingsOfNode(
  nodes: readonly Node[],
  name: string,
  update: ArrayUpdate,
): { updated: readonly Node[]; found: boolean } {
  if (nodes.some((node) => node.name === name)) {
    return { updated: update(nodes), found: true };
  }
  let found = false;
  const updated = nodes.map((node) => {
    if (found) {
      return node;
    }
    const children = Node.children(node);
    if (children.length === 0) {
      return node;
    }
    const result = updateSiblingsOfNode(children, name, update);
    if (result.found) {
      found = true;
      return { ...node, children: result.updated };
    }
    return node;
  });
  return { updated, found };
}

function findNode(nodes: readonly Node[], name: string): Option<Node> {
  for (const node of nodes) {
    if (node.name === name) {
      return Option.some(node);
    }
    const found = findNode(Node.children(node), name);
    if (found.some) {
      return found;
    }
  }
  return Option.none;
}

function findNodeInArtboards(
  artboards: readonly Artboard[],
  name: string,
): Option<Node> {
  for (const artboard of artboards) {
    const found = findNode(artboard.children, name);
    if (found.some) {
      return found;
    }
  }
  return Option.none;
}

function updateSiblingsOfArtboards(
  artboards: readonly Artboard[],
  name: string,
  update: ArrayUpdate,
): { artboards: readonly Artboard[]; found: boolean } {
  let found = false;
  const updated = artboards.map((artboard) => {
    if (found) {
      return artboard;
    }
    const result = updateSiblingsOfNode(artboard.children, name, update);
    if (result.found) {
      found = true;
      return { ...artboard, children: result.updated };
    }
    return artboard;
  });
  return { artboards: updated, found };
}

function toValidationErrors(
  nodeName: string,
  errors: readonly PropValidationError[],
): readonly DesignDocumentValidationError[] {
  return errors.map((error) => ({ ...error, nodeName }));
}

function validateTypedProps(
  nodeName: string,
  type: string,
  props: Props | undefined,
  tokens: TokenSet,
): readonly DesignDocumentValidationError[] {
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
  return toValidationErrors(
    nodeName,
    PropDefinitionRecord.validate(schema.props, props ?? {}, tokens),
  );
}

function validateNode(
  node: Node,
  tokens: TokenSet,
): readonly DesignDocumentValidationError[] {
  if (Node.isRef(node)) {
    return [];
  }
  return [
    ...validateTypedProps(node.name, node.type, node.props, tokens),
    ...Node.children(node).flatMap((child) => validateNode(child, tokens)),
  ];
}

/** 参照検証が横断的に必要とする、ドキュメント全体の文脈。 */
type ReferenceContext = Readonly<{
  components: ComponentSet;
  tokens: TokenSet;
}>;

/** binding 不整合エラーの発生位置。 */
type BindingLocation = Readonly<{
  componentName: string;
  publicPropName: string;
}>;

/**
 * binding が最終的に指すプリミティブ prop の定義を解決する。
 * binding 先が ref ノードの場合は参照先部品の publicProps を辿る（インターフェースの連鎖）。
 * 解決できない場合は binding 自体が不整合であり、binding 検証側で報告される。
 */
function resolvePropDefinition(
  context: ReferenceContext,
  componentName: string,
  binding: PublicPropBinding,
  visited: ReadonlySet<string>,
): Option<PropDefinition> {
  const component = ComponentSet.get(context.components, componentName);
  if (component === undefined) {
    return Option.none;
  }
  const found = Component.findNode(component, componentName, binding.node);
  if (!found.some) {
    return Option.none;
  }
  const target = found.value;
  if (Node.isPrimitive(target)) {
    if (!PrimitiveSchema.isPrimitiveType(target.type)) {
      return Option.none;
    }
    const schema: PrimitiveSchema = PrimitiveSchema.forType(target.type);
    return Option.fromNullable(schema.props[binding.prop]);
  }
  if (visited.has(target.ref)) {
    return Option.none;
  }
  const nested = ComponentSet.get(context.components, target.ref);
  if (nested === undefined) {
    return Option.none;
  }
  const nestedBinding = Component.binding(nested, binding.prop);
  if (!nestedBinding.some) {
    return Option.none;
  }
  return resolvePropDefinition(
    context,
    target.ref,
    nestedBinding.value,
    new Set(visited).add(target.ref),
  );
}

function validateOverrides(
  context: ReferenceContext,
  refNode: RefNode,
  component: Component,
): readonly DesignDocumentValidationError[] {
  return Object.entries(refNode.overrides ?? {}).flatMap(
    ([propName, value]) => {
      const binding = Component.binding(component, propName);
      if (!binding.some) {
        return [
          {
            kind: "undeclared-override" as const,
            nodeName: refNode.name,
            prop: propName,
            message: `component "${refNode.ref}" does not declare public prop "${propName}"`,
          },
        ];
      }
      const definition = resolvePropDefinition(
        context,
        refNode.ref,
        binding.value,
        new Set([refNode.ref]),
      );
      if (!definition.some) {
        return [];
      }
      return toValidationErrors(
        refNode.name,
        PropDefinition.validate(
          definition.value,
          propName,
          value,
          context.tokens,
        ),
      );
    },
  );
}

function validateRefNode(
  context: ReferenceContext,
  refNode: RefNode,
): readonly DesignDocumentValidationError[] {
  const component = ComponentSet.get(context.components, refNode.ref);
  if (component === undefined) {
    return [
      {
        kind: "dangling-ref",
        nodeName: refNode.name,
        message: `unknown component "${refNode.ref}"`,
      },
    ];
  }
  return validateOverrides(context, refNode, component);
}

function validateNodeRefs(
  context: ReferenceContext,
  node: Node,
): readonly DesignDocumentValidationError[] {
  if (Node.isRef(node)) {
    return validateRefNode(context, node);
  }
  return Node.children(node).flatMap((child) =>
    validateNodeRefs(context, child),
  );
}

function validateBindingTarget(
  context: ReferenceContext,
  location: BindingLocation,
  binding: PublicPropBinding,
  target: Node,
): readonly DesignDocumentValidationError[] {
  if (Node.isRef(target)) {
    const nested = ComponentSet.get(context.components, target.ref);
    if (nested === undefined || Component.isPublicProp(nested, binding.prop)) {
      return [];
    }
    return [
      {
        kind: "dangling-binding-prop",
        nodeName: location.componentName,
        prop: location.publicPropName,
        message: `public prop "${location.publicPropName}" binds to "${binding.prop}", which component "${target.ref}" does not declare as a public prop`,
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
      nodeName: location.componentName,
      prop: location.publicPropName,
      message: `public prop "${location.publicPropName}" binds to unknown prop "${binding.prop}" of node "${binding.node}"`,
    },
  ];
}

function validateBindings(
  context: ReferenceContext,
  componentName: string,
  component: Component,
): readonly DesignDocumentValidationError[] {
  return Component.publicPropNames(component).flatMap((publicPropName) => {
    const binding = Component.binding(component, publicPropName);
    if (!binding.some) {
      return [];
    }
    const location: BindingLocation = { componentName, publicPropName };
    const found = Component.findNode(
      component,
      componentName,
      binding.value.node,
    );
    if (!found.some) {
      return [
        {
          kind: "dangling-binding-node" as const,
          nodeName: componentName,
          prop: publicPropName,
          message: `public prop "${publicPropName}" binds to unknown node "${binding.value.node}"`,
        },
      ];
    }
    return validateBindingTarget(context, location, binding.value, found.value);
  });
}

function validateCircularRefs(
  components: ComponentSet,
): readonly DesignDocumentValidationError[] {
  return ComponentSet.circularNames(components).map((name) => ({
    kind: "circular-ref" as const,
    nodeName: name,
    message: `component "${name}" is part of a circular reference`,
  }));
}

function toComponent(node: Node): Component {
  if (!Node.isPrimitive(node)) {
    throw new Error(`cannot create a component from ref node "${node.name}"`);
  }
  return {
    type: node.type,
    ...(node.props !== undefined ? { props: node.props } : {}),
    ...(node.children !== undefined ? { children: node.children } : {}),
  };
}

function collectAllNames(document: DesignDocument): readonly string[] {
  const componentNames = ComponentSet.names(document.components);
  const artboardNames = document.artboards.map((artboard) => artboard.name);
  const nodeNames = document.artboards.flatMap((artboard) =>
    artboard.children.flatMap(Node.collectNames),
  );
  return [...componentNames, ...artboardNames, ...nodeNames];
}

function nextAvailableName(
  baseName: string,
  usedNames: ReadonlySet<string>,
): string {
  if (!usedNames.has(baseName)) {
    return baseName;
  }
  let suffix = 2;
  while (usedNames.has(`${baseName}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseName}-${suffix}`;
}

function generateRenameMap(
  names: readonly string[],
  usedNames: ReadonlySet<string>,
): Readonly<Record<string, string>> {
  const taken = new Set(usedNames);
  const renameMap: Record<string, string> = {};
  for (const name of names) {
    const newName = nextAvailableName(name, taken);
    renameMap[name] = newName;
    taken.add(newName);
  }
  return renameMap;
}

export const DesignDocument = {
  create(params: {
    formatVersion?: FormatVersion;
    tokens?: TokenSet;
    components?: ComponentSet;
    artboards?: readonly Artboard[];
  }): DesignDocument {
    return {
      formatVersion: params.formatVersion ?? FormatVersion.CURRENT,
      tokens: params.tokens ?? TokenSet.empty(),
      components: params.components ?? {},
      artboards: params.artboards ?? [],
    };
  },

  compatibility(document: DesignDocument): FormatVersionCompatibility {
    return FormatVersion.compatibility(document.formatVersion);
  },

  insertNode(
    document: DesignDocument,
    parentName: string,
    index: number,
    node: Node,
  ): DesignDocument {
    const result = updateChildrenOfParent(
      document.artboards,
      parentName,
      (children) => ArrayEx.insertAt(children, index, node),
    );
    if (!result.found) {
      throw new Error(`parent "${parentName}" not found`);
    }
    return { ...document, artboards: result.artboards };
  },

  removeNode(document: DesignDocument, name: string): DesignDocument {
    const result = updateSiblingsOfArtboards(
      document.artboards,
      name,
      (siblings) => siblings.filter((sibling) => sibling.name !== name),
    );
    if (!result.found) {
      throw new Error(`node "${name}" not found`);
    }
    return { ...document, artboards: result.artboards };
  },

  findNode(document: DesignDocument, name: string): Option<Node> {
    return findNodeInArtboards(document.artboards, name);
  },

  replaceNode(
    document: DesignDocument,
    name: string,
    node: Node,
  ): Result<DesignDocument, Error> {
    const result = updateSiblingsOfArtboards(
      document.artboards,
      name,
      (siblings) =>
        siblings.map((sibling) => (sibling.name === name ? node : sibling)),
    );
    if (!result.found) {
      return Result.err(new Error(`node "${name}" not found`));
    }
    return Result.ok({ ...document, artboards: result.artboards });
  },

  reorderNode(
    document: DesignDocument,
    parentName: string,
    fromIndex: number,
    toIndex: number,
  ): DesignDocument {
    const result = updateChildrenOfParent(
      document.artboards,
      parentName,
      (children) => ArrayEx.moveWithin(children, fromIndex, toIndex),
    );
    if (!result.found) {
      throw new Error(`parent "${parentName}" not found`);
    }
    return { ...document, artboards: result.artboards };
  },

  moveNode(
    document: DesignDocument,
    name: string,
    newParentName: string,
    index: number,
  ): DesignDocument {
    const found = findNodeInArtboards(document.artboards, name);
    if (!found.some) {
      throw new Error(`node "${name}" not found`);
    }
    const node = found.value;
    if (Node.collectNames(node).includes(newParentName)) {
      throw new Error(
        `cannot move node "${name}" into itself or its own descendant`,
      );
    }
    const withoutNode = DesignDocument.removeNode(document, name);
    return DesignDocument.insertNode(withoutNode, newParentName, index, node);
  },

  createComponent(
    document: DesignDocument,
    name: string,
    componentName: string,
  ): DesignDocument {
    const found = findNodeInArtboards(document.artboards, name);
    if (!found.some) {
      throw new Error(`node "${name}" not found`);
    }
    if (DesignDocument.usedNames(document).has(componentName)) {
      throw new Error(`component name "${componentName}" is already used`);
    }
    const component = toComponent(found.value);
    const refNode: RefNode = { name, ref: componentName };
    const result = updateSiblingsOfArtboards(
      document.artboards,
      name,
      (siblings) =>
        siblings.map((sibling) => (sibling.name === name ? refNode : sibling)),
    );
    return {
      ...document,
      components: { ...document.components, [componentName]: component },
      artboards: result.artboards,
    };
  },

  insertArtboard(
    document: DesignDocument,
    index: number,
    artboard: Artboard,
  ): DesignDocument {
    return {
      ...document,
      artboards: ArrayEx.insertAt(document.artboards, index, artboard),
    };
  },

  removeArtboard(document: DesignDocument, name: string): DesignDocument {
    const index = document.artboards.findIndex(
      (artboard) => artboard.name === name,
    );
    if (index === -1) {
      throw new Error(`artboard "${name}" not found`);
    }
    return {
      ...document,
      artboards: [
        ...document.artboards.slice(0, index),
        ...document.artboards.slice(index + 1),
      ],
    };
  },

  reorderArtboard(
    document: DesignDocument,
    fromIndex: number,
    toIndex: number,
  ): DesignDocument {
    return {
      ...document,
      artboards: ArrayEx.moveWithin(document.artboards, fromIndex, toIndex),
    };
  },

  usedNames(document: DesignDocument): ReadonlySet<string> {
    return new Set(collectAllNames(document));
  },

  uniqueName(baseName: string, usedNames: ReadonlySet<string>): string {
    return nextAvailableName(baseName, usedNames);
  },

  renameSubtree(
    nodes: readonly Node[],
    usedNames: ReadonlySet<string>,
  ): { nodes: readonly Node[]; renameMap: Readonly<Record<string, string>> } {
    const renameMap = generateRenameMap(
      nodes.flatMap(Node.collectNames),
      usedNames,
    );
    return {
      nodes: nodes.map((node) => Node.rename(node, renameMap)),
      renameMap,
    };
  },

  validate(document: DesignDocument): readonly DesignDocumentValidationError[] {
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
          ...validateBindings(context, name, component),
          ...(component.children ?? []).flatMap((child) =>
            validateNodeRefs(context, child),
          ),
        ];
      },
    );

    const artboardErrors = document.artboards.flatMap((artboard) => [
      ...toValidationErrors(
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
      ...artboard.children.flatMap((child) => validateNodeRefs(context, child)),
    ]);

    return [
      ...componentErrors,
      ...artboardErrors,
      ...validateCircularRefs(document.components),
    ];
  },
} as const;

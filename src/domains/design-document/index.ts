import type { Artboard } from "@/domains/artboard";
import { type Component, ComponentSet } from "@/domains/component";
import {
  FormatVersion,
  type FormatVersionCompatibility,
} from "@/domains/format-version";
import { Node, type RefNode } from "@/domains/node";
import { PrimitiveSchema } from "@/domains/primitive-schema";
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

  findNode(document: DesignDocument, name: string): Node | undefined {
    const found = findNodeInArtboards(document.artboards, name);
    return found.some ? found.value : undefined;
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
} as const;

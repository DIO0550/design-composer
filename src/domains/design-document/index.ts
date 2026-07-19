import type { Artboard } from "@/domains/artboard";
import type { ComponentSet } from "@/domains/component";
import {
  FormatVersion,
  type FormatVersionCompatibility,
} from "@/domains/format-version";
import { Node } from "@/domains/node";
import { PrimitiveSchema } from "@/domains/primitive-schema";
import { TokenSet } from "@/domains/token";
import { ArrayEx } from "@/utils/ArrayEx";

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

function findNode(nodes: readonly Node[], name: string): Node | undefined {
  for (const node of nodes) {
    if (node.name === name) {
      return node;
    }
    const found = findNode(Node.children(node), name);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function findNodeInArtboards(
  artboards: readonly Artboard[],
  name: string,
): Node | undefined {
  for (const artboard of artboards) {
    const found = findNode(artboard.children, name);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function collectSubtreeNames(node: Node): readonly string[] {
  return [node.name, ...Node.children(node).flatMap(collectSubtreeNames)];
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
    const node = findNodeInArtboards(document.artboards, name);
    if (!node) {
      throw new Error(`node "${name}" not found`);
    }
    if (collectSubtreeNames(node).includes(newParentName)) {
      throw new Error(
        `cannot move node "${name}" into itself or its own descendant`,
      );
    }
    const withoutNode = DesignDocument.removeNode(document, name);
    return DesignDocument.insertNode(withoutNode, newParentName, index, node);
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
} as const;

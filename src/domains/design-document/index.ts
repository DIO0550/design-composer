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
import { NumberEx } from "@/utils/NumberEx";

export type DesignDocument = Readonly<{
  formatVersion: FormatVersion;
  tokens: TokenSet;
  components: ComponentSet;
  artboards: readonly Artboard[];
}>;

function insertAt<T>(
  items: readonly T[],
  index: number,
  item: T,
): readonly T[] {
  if (
    !NumberEx.isNatural(index) ||
    !ArrayEx.isInsertionIndexInRange(items, index)
  ) {
    throw new Error(
      `index ${index} is out of bounds for length ${items.length}`,
    );
  }
  return [...items.slice(0, index), item, ...items.slice(index)];
}

function moveWithin<T>(
  items: readonly T[],
  fromIndex: number,
  toIndex: number,
): readonly T[] {
  if (
    !NumberEx.isNatural(fromIndex) ||
    !ArrayEx.isIndexInRange(items, fromIndex)
  ) {
    throw new Error(
      `fromIndex ${fromIndex} is out of bounds for length ${items.length}`,
    );
  }
  if (!NumberEx.isNatural(toIndex) || !ArrayEx.isIndexInRange(items, toIndex)) {
    throw new Error(
      `toIndex ${toIndex} is out of bounds for length ${items.length}`,
    );
  }
  const item = items[fromIndex];
  const without = [...items.slice(0, fromIndex), ...items.slice(fromIndex + 1)];
  return [...without.slice(0, toIndex), item, ...without.slice(toIndex)];
}

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
      (children) => insertAt(children, index, node),
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
      (children) => moveWithin(children, fromIndex, toIndex),
    );
    if (!result.found) {
      throw new Error(`parent "${parentName}" not found`);
    }
    return { ...document, artboards: result.artboards };
  },

  insertArtboard(
    document: DesignDocument,
    index: number,
    artboard: Artboard,
  ): DesignDocument {
    return {
      ...document,
      artboards: insertAt(document.artboards, index, artboard),
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
      artboards: moveWithin(document.artboards, fromIndex, toIndex),
    };
  },
} as const;

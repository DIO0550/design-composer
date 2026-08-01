import type { Artboard } from "@/domains/artboard";
import { Node } from "@/domains/node";
import { PrimitiveSchema } from "@/domains/primitive-schema";
import { ArrayEx, type IndexOutOfRange } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import type { DesignDocumentV1 as DesignDocument } from "../v1";

/**
 * ツリー編集操作（挿入・削除・並べ替え・移動・部品化）が失敗する理由。
 * 呼び出し側が種類で分岐できるよう、メッセージ文字列ではなく直和で列挙する。
 */
export type DesignDocumentEditError =
  | Readonly<{ kind: "node-not-found"; name: string }>
  | Readonly<{ kind: "parent-not-found"; name: string }>
  | Readonly<{ kind: "artboard-not-found"; name: string }>
  | Readonly<{ kind: "children-not-allowed"; name: string }>
  | Readonly<{ kind: "move-into-descendant"; name: string; parentName: string }>
  | Readonly<{ kind: "ref-node-not-supported"; name: string }>
  | Readonly<{ kind: "duplicate-name"; name: string }>
  | Readonly<{ kind: "index-out-of-range"; index: number; length: number }>;

/**
 * ツリー上の「どの親の何番目の子か」という位置。
 * 親の名前と index は片方だけでは位置が決まらないため1つの型にまとめる。
 */
export type ChildPosition = Readonly<{
  parentName: string;
  index: number;
}>;

export const DesignDocumentEditError = {
  /**
   * 診断用の英語メッセージ。
   * 利用者向けの文言は `kind` で分岐して表示層が組み立てる。
   */
  message(error: DesignDocumentEditError): string {
    switch (error.kind) {
      case "node-not-found":
        return `node "${error.name}" not found`;
      case "parent-not-found":
        return `parent "${error.name}" not found`;
      case "artboard-not-found":
        return `artboard "${error.name}" not found`;
      case "children-not-allowed":
        return `node "${error.name}" cannot have children`;
      case "move-into-descendant":
        return `cannot move node "${error.name}" into "${error.parentName}" because it is the node itself or its descendant`;
      case "ref-node-not-supported":
        return `cannot create a component from ref node "${error.name}"`;
      case "duplicate-name":
        return `name "${error.name}" is already used`;
      case "index-out-of-range":
        return `index ${error.index} is out of bounds for length ${error.length}`;
    }
  },
} as const;

function canNodeHaveChildren(node: Node): boolean {
  return Node.isPrimitive(node) && PrimitiveSchema.allowsChildren(node.type);
}

/**
 * 配列操作の結果を、ドキュメント編集の結果として意味づける。
 * 範囲外がどの操作の失敗にあたるかは `ArrayEx` 側では決められない
 * （ドメイン知識を持たないため）ので、その解釈だけをここで与える。
 */
function toEditResult<T>(
  result: Result<readonly T[], IndexOutOfRange>,
): Result<readonly T[], DesignDocumentEditError> {
  return Result.mapErr(result, (range) => ({
    kind: "index-out-of-range",
    ...range,
  }));
}

/** 兄弟の並びの差し替え。失敗しない（対象が見つかったかどうかは呼び出し側が判断する）。 */
type SiblingsUpdate = (siblings: readonly Node[]) => readonly Node[];

/** 親の children の差し替え。範囲外 index などで失敗しうる。 */
type ChildrenUpdate = (
  children: readonly Node[],
) => Result<readonly Node[], DesignDocumentEditError>;

type NodesUpdate = Readonly<{ updated: readonly Node[]; found: boolean }>;

type ArtboardsUpdate = Readonly<{
  artboards: readonly Artboard[];
  found: boolean;
}>;

function updateChildrenOfNode(
  nodes: readonly Node[],
  parentName: string,
  update: ChildrenUpdate,
): Result<NodesUpdate, DesignDocumentEditError> {
  const parentIndex = nodes.findIndex((node) => node.name === parentName);
  if (parentIndex !== -1) {
    const parent = nodes[parentIndex];
    if (!canNodeHaveChildren(parent)) {
      return Result.err({ kind: "children-not-allowed", name: parentName });
    }
    return Result.flatMap(update(Node.children(parent)), (children) =>
      Result.map(
        toEditResult(
          ArrayEx.replaceAt(nodes, parentIndex, { ...parent, children }),
        ),
        (updated) => ({ updated, found: true }),
      ),
    );
  }

  const hostIndex = nodes.findIndex(
    (node) => findNodeInNodes(Node.children(node), parentName).some,
  );
  if (hostIndex === -1) {
    return Result.ok({ updated: nodes, found: false });
  }
  const host = nodes[hostIndex];
  return Result.flatMap(
    updateChildrenOfNode(Node.children(host), parentName, update),
    (result) =>
      Result.map(
        toEditResult(
          ArrayEx.replaceAt(nodes, hostIndex, {
            ...host,
            children: result.updated,
          }),
        ),
        (updated) => ({ updated, found: true }),
      ),
  );
}

function updateChildrenOfParent(
  artboards: readonly Artboard[],
  parentName: string,
  update: ChildrenUpdate,
): Result<ArtboardsUpdate, DesignDocumentEditError> {
  const artboardIndex = artboards.findIndex(
    (artboard) => artboard.name === parentName,
  );
  if (artboardIndex !== -1) {
    const artboard = artboards[artboardIndex];
    return Result.flatMap(update(artboard.children), (children) =>
      Result.map(
        toEditResult(
          ArrayEx.replaceAt(artboards, artboardIndex, {
            ...artboard,
            children,
          }),
        ),
        (updated) => ({ artboards: updated, found: true }),
      ),
    );
  }

  const hostIndex = artboards.findIndex(
    (artboard) => findNodeInNodes(artboard.children, parentName).some,
  );
  if (hostIndex === -1) {
    return Result.ok({ artboards, found: false });
  }
  const host = artboards[hostIndex];
  return Result.flatMap(
    updateChildrenOfNode(host.children, parentName, update),
    (result) =>
      Result.map(
        toEditResult(
          ArrayEx.replaceAt(artboards, hostIndex, {
            ...host,
            children: result.updated,
          }),
        ),
        (updated) => ({ artboards: updated, found: true }),
      ),
  );
}

function updateSiblingsOfNode(
  nodes: readonly Node[],
  name: string,
  update: SiblingsUpdate,
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

function findNodeInNodes(nodes: readonly Node[], name: string): Option<Node> {
  for (const node of nodes) {
    if (node.name === name) {
      return Option.some(node);
    }
    const found = findNodeInNodes(Node.children(node), name);
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
    const found = findNodeInNodes(artboard.children, name);
    if (found.some) {
      return found;
    }
  }
  return Option.none;
}

function updateSiblingsOfArtboards(
  artboards: readonly Artboard[],
  name: string,
  update: SiblingsUpdate,
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

/**
 * ツリー上の位置へノードを挿入する。
 * 位置は「どの親の何番目か」で指すので、親が子を持てない・親が居ない・
 * index が範囲外、のいずれでも失敗しうる。
 */
export function insertNode(
  document: DesignDocument,
  at: ChildPosition,
  node: Node,
): Result<DesignDocument, DesignDocumentEditError> {
  return Result.flatMap(
    updateChildrenOfParent(document.artboards, at.parentName, (children) =>
      toEditResult(ArrayEx.insertAt(children, at.index, node)),
    ),
    (result) =>
      result.found
        ? Result.ok({ ...document, artboards: result.artboards })
        : Result.err({ kind: "parent-not-found", name: at.parentName }),
  );
}

/** 名前で指したノードをツリーから取り除く。 */
export function removeNode(
  document: DesignDocument,
  name: string,
): Result<DesignDocument, DesignDocumentEditError> {
  const result = updateSiblingsOfArtboards(
    document.artboards,
    name,
    (siblings) => siblings.filter((sibling) => sibling.name !== name),
  );
  if (!result.found) {
    return Result.err({ kind: "node-not-found", name });
  }
  return Result.ok({ ...document, artboards: result.artboards });
}

/** 名前でノードを引く。artboard 直下だけでなく子孫も辿る。 */
export function findNode(document: DesignDocument, name: string): Option<Node> {
  return findNodeInArtboards(document.artboards, name);
}

/** 名前で指したノードを別のノードに差し替える。 */
export function replaceNode(
  document: DesignDocument,
  name: string,
  node: Node,
): Result<DesignDocument, DesignDocumentEditError> {
  const result = updateSiblingsOfArtboards(
    document.artboards,
    name,
    (siblings) =>
      siblings.map((sibling) => (sibling.name === name ? node : sibling)),
  );
  if (!result.found) {
    return Result.err({ kind: "node-not-found", name });
  }
  return Result.ok({ ...document, artboards: result.artboards });
}

/**
 * 同一の親の中で子を動かす。移動元は「どの親の何番目か」で指す位置なので
 * 移動先は同じ親の中の index だけで決まる（親をまたぐ移動は `moveNode`）。
 */
export function reorderNode(
  document: DesignDocument,
  from: ChildPosition,
  toIndex: number,
): Result<DesignDocument, DesignDocumentEditError> {
  return Result.flatMap(
    updateChildrenOfParent(document.artboards, from.parentName, (children) =>
      toEditResult(ArrayEx.moveWithin(children, from.index, toIndex)),
    ),
    (result) =>
      result.found
        ? Result.ok({ ...document, artboards: result.artboards })
        : Result.err({ kind: "parent-not-found", name: from.parentName }),
  );
}

/**
 * ノードを別の親の下へ移す（同一の親の中での並べ替えは `reorderNode`）。
 * 自分自身や自分の子孫を移動先に指定するとツリーが壊れるため、
 * `move-into-descendant` として失敗させる。
 */
export function moveNode(
  document: DesignDocument,
  name: string,
  to: ChildPosition,
): Result<DesignDocument, DesignDocumentEditError> {
  const found = findNodeInArtboards(document.artboards, name);
  if (!found.some) {
    return Result.err({ kind: "node-not-found", name });
  }
  const node = found.value;
  if (Node.collectNames(node).includes(to.parentName)) {
    return Result.err({
      kind: "move-into-descendant",
      name,
      parentName: to.parentName,
    });
  }
  return Result.flatMap(removeNode(document, name), (without) =>
    insertNode(without, to, node),
  );
}

/** artboard をドキュメントの指定位置へ挿入する。 */
export function insertArtboard(
  document: DesignDocument,
  index: number,
  artboard: Artboard,
): Result<DesignDocument, DesignDocumentEditError> {
  return Result.map(
    toEditResult(ArrayEx.insertAt(document.artboards, index, artboard)),
    (artboards) => ({ ...document, artboards }),
  );
}

/** 名前で指した artboard をドキュメントから取り除く。 */
export function removeArtboard(
  document: DesignDocument,
  name: string,
): Result<DesignDocument, DesignDocumentEditError> {
  const index = document.artboards.findIndex(
    (artboard) => artboard.name === name,
  );
  if (index === -1) {
    return Result.err({ kind: "artboard-not-found", name });
  }
  return Result.ok({
    ...document,
    artboards: [
      ...document.artboards.slice(0, index),
      ...document.artboards.slice(index + 1),
    ],
  });
}

/** artboard の並び順を入れ替える。 */
export function reorderArtboard(
  document: DesignDocument,
  fromIndex: number,
  toIndex: number,
): Result<DesignDocument, DesignDocumentEditError> {
  return Result.map(
    toEditResult(ArrayEx.moveWithin(document.artboards, fromIndex, toIndex)),
    (artboards) => ({ ...document, artboards }),
  );
}

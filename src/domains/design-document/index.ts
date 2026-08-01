import { Artboard } from "@/domains/artboard";
import { Component, type ComponentSet } from "@/domains/component";
import {
  FormatVersion,
  type FormatVersionCompatibility,
  type FormatVersionOf,
} from "@/domains/format-version";
import { NameSpace } from "@/domains/name-space";
import { Node, type RefNode } from "@/domains/node";
import { NodeTree, type NodeTreeUpdate } from "@/domains/node-tree";
import { TokenSet } from "@/domains/token";
import { ArrayEx } from "@/utils/ArrayEx";
import type { JsonCursor, JsonDecoded, JsonObject } from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import type { DesignDocumentEditError } from "./edit-error";
import { DesignDocumentV1 } from "./v1";
import { collectErrors } from "./validation";

export { DesignDocumentEditError } from "./edit-error";
export type { DesignDocumentV1 } from "./v1";
export type {
  DesignDocumentValidationError,
  DesignDocumentValidationErrorKind,
} from "./validation";

/**
 * アプリが読み書きするドキュメント。今は major 1 のみ。
 *
 * 版ごとの型と JSON 表現は版のフォルダ（`v1/`）が持つ。
 * major を上げるときは隣に `v2/` を作ってここを差し替え、旧版のフォルダは残す。
 * 旧版の型が残ることで、マイグレーション（`libs/document-migration`）が
 * 「どの形から どの形へ」を型で書ける。
 * アプリ本体が旧版の形を扱うことはないので、ここを版の直和にはしない
 * （消費側に版の分岐を強いないため）。
 */
export type DesignDocument = DesignDocumentV1;

/**
 * ツリー上の「どの親の何番目の子か」という位置。
 * 親の名前と index は片方だけでは位置が決まらないため1つの型にまとめる。
 */
export type ChildPosition = Readonly<{
  parentName: string;
  index: number;
}>;

/*
 * 以下の関数は「どの artboard を相手にするか」を選ぶためのもの。
 * 並びの探索・編集そのものは `NodeTree` が、名前の規則は `NameSpace` が持っており、
 * ドキュメントに残るのは「複数の artboard のどれに対して行うか」という調停だけ。
 */

/** 名前で指したノードを持つ artboard を、その位置とともに返す。 */
function artboardIndexOfNode(
  document: DesignDocument,
  name: string,
): Option<number> {
  const index = document.artboards.findIndex(
    (artboard) => Artboard.findNode(artboard, name).some,
  );
  return index === -1 ? Option.none : Option.some(index);
}

/** index 番目の artboard のツリーを差し替えたドキュメント。 */
function withArtboardTree(
  document: DesignDocument,
  index: number,
  tree: NodeTree,
): DesignDocument {
  return {
    ...document,
    artboards: document.artboards.map((artboard, current) =>
      current === index ? Artboard.withTree(artboard, tree) : artboard,
    ),
  };
}

/**
 * 名前で指したノードを含む並びを差し替える。
 * 対象がどの artboard に居るかを選ぶところだけがここの責務。
 */
function updateSiblingsOfNode(
  document: DesignDocument,
  name: string,
  update: (siblings: NodeTree) => NodeTree,
): Result<DesignDocument, DesignDocumentEditError> {
  const found = artboardIndexOfNode(document, name);
  if (!found.some) {
    return Result.err({ kind: "node-not-found", name });
  }
  const updated = NodeTree.updateSiblingsOf(
    Artboard.tree(document.artboards[found.value]),
    name,
    update,
  );
  if (!updated.some) {
    return Result.err({ kind: "node-not-found", name });
  }
  return Result.ok(withArtboardTree(document, found.value, updated.value));
}

/**
 * 名前で指した親の子の並びを差し替える。
 * 親は artboard 自身のこともあるため、artboard 名で当ててから
 * ノードの中を探す、の順で調停する。
 */
function updateChildrenOfParent(
  document: DesignDocument,
  parentName: string,
  update: NodeTreeUpdate,
): Result<DesignDocument, DesignDocumentEditError> {
  const artboardIndex = document.artboards.findIndex(
    (artboard) => artboard.name === parentName,
  );
  if (artboardIndex !== -1) {
    return Result.map(
      update(Artboard.tree(document.artboards[artboardIndex])),
      (tree) => withArtboardTree(document, artboardIndex, tree),
    );
  }

  const hostIndex = document.artboards.findIndex(
    (artboard) => Artboard.findNode(artboard, parentName).some,
  );
  if (hostIndex === -1) {
    return Result.err({ kind: "parent-not-found", name: parentName });
  }
  /*
   * ツリーの失敗はドキュメントの失敗でもあるので、
   * ここで語彙を広げてから「親が見つからない」を足す。
   */
  const updated: Result<
    Option<NodeTree>,
    DesignDocumentEditError
  > = NodeTree.updateChildrenOf(
    Artboard.tree(document.artboards[hostIndex]),
    parentName,
    update,
  );
  return Result.flatMap(updated, (tree) =>
    tree.some
      ? Result.ok(withArtboardTree(document, hostIndex, tree.value))
      : Result.err({ kind: "parent-not-found", name: parentName }),
  );
}

/** ドキュメントに現れる名前の集まり。 */
function nameSpaceOf(document: DesignDocument): NameSpace {
  return NameSpace.of(document.components, document.artboards);
}

/**
 * ドキュメントのコンパニオンオブジェクト。
 * ツリーの探索・編集は `NodeTree`、名前の規則は `NameSpace`、
 * 部品への変換は `Component`、検証は `validation/`、版ごとの JSON 表現は `v1/` が持ち、
 * ここは「どの artboard・どの部品を相手にするか」の調停に徹する。
 */
export const DesignDocument = {
  create(params: {
    formatVersion?: FormatVersionOf<1>;
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

  /**
   * 現在の形式を名乗るドキュメントにする。
   * 書き出しは常に現在の形式で行う（旧形式へのダウングレード書き出しは持たない・
   * マイグレーションは一方向）ため、書き出す値はこれを通したものになる。
   */
  withCurrentFormatVersion(document: DesignDocument): DesignDocument {
    return { ...document, formatVersion: FormatVersion.CURRENT };
  },

  /**
   * JSON のデータモデルからドキュメントを組み立てる。
   * どのフィールドをどう読むかは版ごとの知識なので、現在の版のモジュールが持つ。
   */
  fromJson(cursor: JsonCursor): JsonDecoded<DesignDocument> {
    return DesignDocumentV1.fromJson(cursor);
  },

  /** ドキュメントを JSON のデータモデルへ落とす。表現は現在の版のモジュールが持つ。 */
  toJson(document: DesignDocument): JsonObject {
    return DesignDocumentV1.toJson(document);
  },

  /**
   * ツリー上の位置へノードを挿入する。
   * 位置は「どの親の何番目か」で指すので、親が子を持てない・親が居ない・
   * index が範囲外、のいずれでも失敗しうる。
   */
  insertNode(
    document: DesignDocument,
    at: ChildPosition,
    node: Node,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return updateChildrenOfParent(document, at.parentName, (children) =>
      NodeTree.insertAt(children, at.index, node),
    );
  },

  /** 名前で指したノードをツリーから取り除く。 */
  removeNode(
    document: DesignDocument,
    name: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return updateSiblingsOfNode(document, name, (siblings) =>
      NodeTree.create(
        NodeTree.nodes(siblings).filter((sibling) => sibling.name !== name),
      ),
    );
  },

  /** 名前でノードを引く。artboard 直下だけでなく子孫も辿る。 */
  findNode(document: DesignDocument, name: string): Option<Node> {
    for (const artboard of document.artboards) {
      const found = Artboard.findNode(artboard, name);
      if (found.some) {
        return found;
      }
    }
    return Option.none;
  },

  /** 名前で指したノードを別のノードに差し替える。 */
  replaceNode(
    document: DesignDocument,
    name: string,
    node: Node,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return updateSiblingsOfNode(document, name, (siblings) =>
      NodeTree.create(
        NodeTree.nodes(siblings).map((sibling) =>
          sibling.name === name ? node : sibling,
        ),
      ),
    );
  },

  /**
   * 同一の親の中で子を動かす。移動元は「どの親の何番目か」で指す位置なので
   * 移動先は同じ親の中の index だけで決まる（親をまたぐ移動は `moveNode`）。
   */
  reorderNode(
    document: DesignDocument,
    from: ChildPosition,
    toIndex: number,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return updateChildrenOfParent(document, from.parentName, (children) =>
      NodeTree.moveWithin(children, from.index, toIndex),
    );
  },

  /**
   * ノードを別の親の下へ移す（同一の親の中での並べ替えは `reorderNode`）。
   * 自分自身や自分の子孫を移動先に指定するとツリーが壊れるため、
   * `move-into-descendant` として失敗させる。
   */
  moveNode(
    document: DesignDocument,
    name: string,
    to: ChildPosition,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const found = DesignDocument.findNode(document, name);
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
    return Result.flatMap(
      DesignDocument.removeNode(document, name),
      (without) => DesignDocument.insertNode(without, to, node),
    );
  },

  /**
   * ノードを部品として切り出し、元の位置をその部品への参照に置き換える。
   * 部品名はドキュメントの単一名前空間に加わるため、既存の名前と衝突したら失敗させる。
   */
  createComponent(
    document: DesignDocument,
    name: string,
    componentName: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const found = DesignDocument.findNode(document, name);
    if (!found.some) {
      return Result.err({ kind: "node-not-found", name });
    }
    if (NameSpace.has(nameSpaceOf(document), componentName)) {
      return Result.err({ kind: "duplicate-name", name: componentName });
    }
    const component = Component.fromNode(found.value);
    if (!component.some) {
      return Result.err({ kind: "ref-node-not-supported", name });
    }
    const refNode: RefNode = { name, ref: componentName };
    return Result.map(
      DesignDocument.replaceNode(document, name, refNode),
      (replaced) => ({
        ...replaced,
        components: {
          ...replaced.components,
          [componentName]: component.value,
        },
      }),
    );
  },

  /** artboard をドキュメントの指定位置へ挿入する。 */
  insertArtboard(
    document: DesignDocument,
    index: number,
    artboard: Artboard,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(
      Result.mapErr(
        ArrayEx.insertAt(document.artboards, index, artboard),
        (range): DesignDocumentEditError => ({
          kind: "index-out-of-range",
          ...range,
        }),
      ),
      (artboards) => ({ ...document, artboards }),
    );
  },

  /** 名前で指した artboard をドキュメントから取り除く。 */
  removeArtboard(
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
  },

  /** artboard の並び順を入れ替える。 */
  reorderArtboard(
    document: DesignDocument,
    fromIndex: number,
    toIndex: number,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(
      Result.mapErr(
        ArrayEx.moveWithin(document.artboards, fromIndex, toIndex),
        (range): DesignDocumentEditError => ({
          kind: "index-out-of-range",
          ...range,
        }),
      ),
      (artboards) => ({ ...document, artboards }),
    );
  },

  /** ドキュメントの単一名前空間で使われている名前。 */
  usedNames(document: DesignDocument): ReadonlySet<string> {
    return NameSpace.toSet(nameSpaceOf(document));
  },

  /** その名前が識別子の規則（kebab-case）を満たすか。 */
  isValidIdentifier(name: string): boolean {
    return NameSpace.isValidIdentifier(name);
  },

  /** 使用済みの名前と衝突しない名前。衝突する場合は連番を付ける。 */
  uniqueName(baseName: string, usedNames: ReadonlySet<string>): string {
    return NameSpace.uniqueName(NameSpace.create([...usedNames]), baseName);
  },

  /** 部分木のノード名を、使用済みの名前と衝突しないよう付け替える。 */
  renameSubtree(
    nodes: readonly Node[],
    usedNames: ReadonlySet<string>,
  ): { nodes: readonly Node[]; renameMap: Readonly<Record<string, string>> } {
    const renameMap = NameSpace.renameMap(
      NameSpace.create([...usedNames]),
      nodes.flatMap(Node.collectNames),
    );
    return {
      nodes: nodes.map((node) => Node.rename(node, renameMap)),
      renameMap,
    };
  },

  collectErrors,
} as const;

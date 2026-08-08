import { Artboard } from "@/domains/artboard";
import type { AxisLength } from "@/domains/axis-length";
import type { ChildPosition } from "@/domains/child-position";
import {
  Component,
  type ComponentAsset,
  ComponentSet,
} from "@/domains/component";
import {
  FormatVersion,
  type FormatVersionCompatibility,
  type FormatVersionOf,
} from "@/domains/format-version";
import { NameSpace } from "@/domains/name-space";
import { Node, PropEdit, type RefNode } from "@/domains/node";
import { NodeTree, type NodeTreeUpdate } from "@/domains/node-tree";
import { type Token, type TokenRef, TokenSet } from "@/domains/token";
import { ArrayEx } from "@/utils/ArrayEx";
import type { JsonCursor, JsonDecoded, JsonObject } from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import type { DesignDocumentEditError } from "./edit-error";
import type { DocumentTemplate } from "./template";
import {
  collectArtboardTokenReferrers,
  collectComponentTokenReferrers,
  type TokenReferrer,
} from "./token-referrer";
import { DesignDocumentV1 } from "./v1";
import {
  collectArtboardErrors,
  collectCircularRefErrors,
  collectComponentErrors,
  collectDocumentNameErrors,
  type DesignDocumentValidationError,
  type ReferenceContext,
} from "./validation";

export { DesignDocumentEditError } from "./edit-error";
export { DocumentTemplate } from "./template";
export { TokenReferrer } from "./token-referrer";
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

/**
 * 名前で指した artboard を作り直したドキュメント。
 * その名前の artboard が無ければ `none`（呼び出し側がノードとして相手をする）。
 */
function updateArtboardNamed(
  document: DesignDocument,
  name: string,
  update: (artboard: Artboard) => Artboard,
): Option<DesignDocument> {
  if (!DesignDocument.findArtboard(document, name).some) {
    return Option.none;
  }
  return Option.some({
    ...document,
    artboards: document.artboards.map((artboard) =>
      artboard.name === name ? update(artboard) : artboard,
    ),
  });
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
  return NameSpace.create(
    NameSpace.collectNames(document.components, document.artboards),
  );
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

  /**
   * 雛形から新規ドキュメントを作る（docs/04-tokens.md「新規ドキュメントテンプレート」）。
   * artboards は空で始まる（描く対象はユーザーが足す）。
   * 雛形を引数で受け取るのは、既定を隠さず呼び出し側に選ばせるため。
   */
  createFromTemplate(template: DocumentTemplate): DesignDocument {
    return DesignDocument.create({
      tokens: template.tokens,
      components: template.components,
    });
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

  /**
   * ノードの複製をツリー上の位置へ挿入する（docs/06-ui.md「編集操作の一覧」の
   * コピー & ペースト）。
   *
   * 名前はドキュメント全体で一意でなければならない（docs/01-file-format.md
   * 「ノードの識別（name）」）ので、挿す前に部分木の名前をまとめて付け替える。
   * 付け替えと挿入を呼び出し側に順番で守らせず 1 つの操作にするのは、
   * 付け替え忘れが「重複した名前を持つドキュメント」として通ってしまうため。
   */
  insertNodeCopy(
    document: DesignDocument,
    at: ChildPosition,
    node: Node,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const [renamed] = DesignDocument.renameSubtree(
      [node],
      DesignDocument.usedNames(document),
    ).nodes;
    return DesignDocument.insertNode(document, at, renamed);
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

  /**
   * パレットに並べる部品の一覧。組み立ての規則は `ComponentSet` が持ち、ここは
   * 「部品の外側にある木はどれか」を渡す調停だけを行う（`nameSpaceOf` と同じ形）。
   */
  componentAssets(document: DesignDocument): readonly ComponentAsset[] {
    return ComponentSet.assets(
      document.components,
      document.artboards.flatMap((artboard) => artboard.children),
    );
  },

  /** 名前で artboard を引く。名前は単一名前空間なので artboard 名も一意に決まる。 */
  findArtboard(document: DesignDocument, name: string): Option<Artboard> {
    return Option.fromNullable(
      document.artboards.find((artboard) => artboard.name === name),
    );
  },

  /**
   * その名前のものが載っている artboard。artboard 自身の名前ならその artboard、
   * ノードの名前ならそれを含む artboard（子孫まで辿る）。どちらでもなければ `none`。
   *
   * 名前 1 つから artboard へ辿る道をここに置くのは、「今どの artboard を見ているか」を
   * 選択から決める側（左ペイン）が、artboard とノードのどちらを選んでいるかで
   * 場合分けせずに済むようにするため。名前は単一名前空間なので答えは一意に決まる。
   */
  findOwningArtboard(document: DesignDocument, name: string): Option<Artboard> {
    const named = DesignDocument.findArtboard(document, name);
    if (named.some) {
      return named;
    }
    // 走査そのものは `artboardIndexOfNode` が持つ（同じ探索を 2 つ書かない）
    return Option.map(
      artboardIndexOfNode(document, name),
      (index) => document.artboards[index],
    );
  },

  /**
   * 名前で指したもの（artboard またはノード）の子の並び。
   *
   * artboard は常に子を持てるので必ず並びを持つ。子を持てないノード（Text・参照ノード）と
   * ドキュメントに無い名前は「子の並びが無い」ので `none`。
   * 「子を持てない」（`none`）と「子が 0 件」（`some([])`）は別のことなので区別する。
   */
  findChildren(
    document: DesignDocument,
    name: string,
  ): Option<readonly Node[]> {
    const artboard = DesignDocument.findArtboard(document, name);
    if (artboard.some) {
      return Option.some(artboard.value.children);
    }
    return Option.flatMap(DesignDocument.findNode(document, name), (node) =>
      NodeTree.allowsChildren(node)
        ? Option.some(Node.children(node))
        : Option.none,
    );
  },

  /**
   * その名前のものの子として足すときの位置（並びの末尾）。
   *
   * 足せるかどうかは子の並びを持つかどうかと同じなので `findChildren` に乗せる。
   * 挿入の可否は木の形で決まるためここが答え、UI が `allowsChildren` を見に行かない（#39）。
   */
  appendPositionOf(
    document: DesignDocument,
    parentName: string,
  ): Option<ChildPosition> {
    return Option.map(
      DesignDocument.findChildren(document, parentName),
      (children) => ({ parentName, index: children.length }),
    );
  },

  /**
   * 名前で指したノードが今いる位置を「どの親の何番目か」で引く。
   * artboard 自身は誰の子でもないため位置を持たない（`none`）。
   */
  findChildPosition(
    document: DesignDocument,
    name: string,
  ): Option<ChildPosition> {
    for (const artboard of document.artboards) {
      const found = NodeTree.childPositionOf(
        Artboard.tree(artboard),
        artboard.name,
        name,
      );
      if (found.some) {
        return found;
      }
    }
    return Option.none;
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

  /**
   * 名前で指した artboard またはノードの prop を書き換える
   * （docs/06-ui.md「編集操作の一覧」の props 編集）。
   * 名前は単一名前空間なので、artboard とノードのどちらを相手にするかは名前で決まる。
   */
  applyPropEdit(
    document: DesignDocument,
    name: string,
    edit: PropEdit,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const editedArtboard = updateArtboardNamed(document, name, (artboard) =>
      Artboard.applyPropEdit(artboard, edit),
    );
    if (editedArtboard.some) {
      return Result.ok(editedArtboard.value);
    }
    const found = DesignDocument.findNode(document, name);
    if (!found.some) {
      return Result.err({ kind: "node-not-found", name });
    }
    return DesignDocument.replaceNode(
      document,
      name,
      Node.applyPropEdit(found.value, edit),
    );
  },

  /**
   * 名前で指した artboard またはノードの大きさを変える
   * （docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。
   *
   * 長さの持ち主が artboard とノードで違う（artboard は自身のフィールド、
   * ノードは `width` / `height` prop）ため、名前で相手を決めてから書き込み先を分ける。
   * ノード側でモードが `fixed` かどうかは見ない。ハンドルを出す軸を決めるのは
   * キャンバス側の役目で、ここは指定された長さを書くところ。
   */
  resize(
    document: DesignDocument,
    name: string,
    size: AxisLength,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const resizedArtboard = updateArtboardNamed(document, name, (artboard) =>
      Artboard.resize(artboard, size),
    );
    if (resizedArtboard.some) {
      return Result.ok(resizedArtboard.value);
    }
    return DesignDocument.applyPropEdit(
      document,
      name,
      PropEdit.set(size.axis, size.length),
    );
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

  /**
   * トークンを追加する（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
   * 名前の規則と種別内の一意性は `TokenSet` が見るので、ここは
   * 「ドキュメントのどこを差し替えるか」だけを担う。
   */
  addToken(
    document: DesignDocument,
    token: Token,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(TokenSet.add(document.tokens, token), (tokens) => ({
      ...document,
      tokens,
    }));
  },

  /** トークンの値を差し替える。 */
  replaceToken(
    document: DesignDocument,
    token: Token,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(TokenSet.replace(document.tokens, token), (tokens) => ({
      ...document,
      tokens,
    }));
  },

  /** トークンの名前を変える。 */
  renameToken(
    document: DesignDocument,
    ref: TokenRef,
    newName: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(
      TokenSet.rename(document.tokens, ref, newName),
      (tokens) => ({ ...document, tokens }),
    );
  },

  /** トークンを削除する。 */
  removeToken(
    document: DesignDocument,
    ref: TokenRef,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(TokenSet.remove(document.tokens, ref), (tokens) => ({
      ...document,
      tokens,
    }));
  },

  /**
   * そのトークンを参照している箇所をすべて集める
   * （UI 案 docs/Design Composer.html の `Used by` / #127）。
   *
   * artboard の中（キャンバス上のもの）を先に、部品定義の中を後に並べる。
   * 一覧は先頭の数件しか出さないので、選択やキャンバスから指し示せるものを先に見せる
   * （`collectErrors` は部品を先に並べるが、あちらは全件を読む一覧なので順序の意味が違う）。
   *
   * トークンが実在するかは見ない。「その参照を指している prop はどれか」に答えるので、
   * 宙に浮いた参照（dangling）も同じ関数で数えられる（存在の確認は `TokenSet.has` の担当）。
   */
  collectTokenReferrers(
    document: DesignDocument,
    ref: TokenRef,
  ): readonly TokenReferrer[] {
    const artboardReferrers = document.artboards.flatMap((artboard) =>
      collectArtboardTokenReferrers(document.components, artboard, ref),
    );
    const componentReferrers = ComponentSet.names(document.components).flatMap(
      (name) => collectComponentTokenReferrers(document.components, name, ref),
    );
    return [...artboardReferrers, ...componentReferrers];
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

  /**
   * ドキュメントが仕様に適合しない箇所をすべて集める。
   * 最初の1件で止めないのは、不正なファイルのエラー一覧を出せるようにするため。
   * 適合の規則そのものは `validation/` が関心ごとに持ち、
   * ここは「どの部品・どの artboard を検証対象にするか」の取りまとめを行う。
   */
  collectErrors(
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
  },
} as const;

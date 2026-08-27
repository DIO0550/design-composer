import type { ChildPosition } from "@/domains/dcmp/child-position";
import { Node } from "@/domains/dcmp/node";
import { PrimitiveSchema } from "@/domains/dcmp/primitive-schema";
import { ArrayEx, type IndexOutOfRange } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * 同じ親を共有するノードの並び。ツリーの一階層を表す。
 *
 * artboard の `children`・ノードの `children`・部品の `children` はいずれもこの形で、
 * 「並びの中を探す」「並びを編集する」規則は入れ物によらず同じなのでここに集める。
 * `Node` 自身にこれらを持たせられないのは、子を持てるかの判定に `PrimitiveSchema` が
 * 要るのに対し、`PrimitiveSchema` が `Node` を import しているため（循環になる）。
 */
export type NodeTree = Readonly<{ nodes: readonly Node[] }>;

/**
 * ツリーの編集が失敗する理由。
 * 「どのノードが」「どの位置が」不正だったかを呼び出し側が分岐できるよう直和で持つ。
 */
export type NodeTreeEditError =
  | Readonly<{ kind: "children-not-allowed"; name: string }>
  | Readonly<{ kind: "index-out-of-range"; index: number; length: number }>;

/** 並びの差し替え。範囲外 index などで失敗しうる。 */
export type NodeTreeUpdate = (
  tree: NodeTree,
) => Result<NodeTree, NodeTreeEditError>;

/**
 * 配列操作の結果を、ツリー編集の結果として意味づける。
 * 範囲外がどの操作の失敗にあたるかは `ArrayEx` 側では決められない
 * （ドメイン知識を持たないため）ので、その解釈だけをここで与える。
 *
 * @param result 配列操作の結果
 * @returns ツリー。範囲外の失敗は `index-out-of-range` として意味づける
 */
function toTreeResult(
  result: Result<readonly Node[], IndexOutOfRange>,
): Result<NodeTree, NodeTreeEditError> {
  return Result.map(
    Result.mapErr(
      result,
      (range): NodeTreeEditError => ({
        kind: "index-out-of-range",
        ...range,
      }),
    ),
    (nodes) => ({ nodes }),
  );
}

export const NodeTree = {
  /**
   * そのノードが子を持てるか（プリミティブで、かつスキーマが子を認めているか）。
   * `Node` ではなくここに置く理由は、このファイル冒頭のコメント（循環）と同じ。
   */
  allowsChildren(node: Node): boolean {
    return Node.isPrimitive(node) && PrimitiveSchema.allowsChildren(node.type);
  },

  create(nodes: readonly Node[]): NodeTree {
    return { nodes };
  },

  /** 並びを配列として取り出す。入れ物（artboard / ノード）へ書き戻すときに使う。 */
  nodes(tree: NodeTree): readonly Node[] {
    return tree.nodes;
  },

  /**
   * 名前でノードを探し、それが「どの親の何番目か」を返す。並びの子孫も辿る。
   * 並び自体の入れ物（artboard / ノード）の名前は外から与える。
   * `NodeTree` は自分が誰の子の並びなのかを知らないため。
   */
  childPositionOf(
    tree: NodeTree,
    parentName: string,
    name: string,
  ): Option<ChildPosition> {
    const index = tree.nodes.findIndex((node) => node.name === name);
    if (index !== -1) {
      return Option.some({ parentName, index });
    }
    for (const node of tree.nodes) {
      const found = NodeTree.childPositionOf(
        NodeTree.create(Node.children(node)),
        node.name,
        name,
      );
      if (found.some) {
        return found;
      }
    }
    return Option.none;
  },

  /** 名前でノードを探す。並びの直下だけでなく子孫も辿る。 */
  find(tree: NodeTree, name: string): Option<Node> {
    for (const node of tree.nodes) {
      const found = Node.find(node, name);
      if (found.some) {
        return found;
      }
    }
    return Option.none;
  },

  /** 並びの指定位置へノードを挿入する。 */
  insertAt(
    tree: NodeTree,
    index: number,
    node: Node,
  ): Result<NodeTree, NodeTreeEditError> {
    return toTreeResult(ArrayEx.insertAt(tree.nodes, index, node));
  },

  /** 並びの中で位置を入れ替える。 */
  moveWithin(
    tree: NodeTree,
    fromIndex: number,
    toIndex: number,
  ): Result<NodeTree, NodeTreeEditError> {
    return toTreeResult(ArrayEx.moveWithin(tree.nodes, fromIndex, toIndex));
  },

  /**
   * 名前で指したノードを持つ並びを差し替える。
   * 対象が子孫にある場合はその階層の並びだけを差し替える。見つからなければ `none`。
   */
  updateSiblingsOf(
    tree: NodeTree,
    name: string,
    update: (siblings: NodeTree) => NodeTree,
  ): Option<NodeTree> {
    if (tree.nodes.some((node) => node.name === name)) {
      return Option.some(update(tree));
    }
    const hostIndex = tree.nodes.findIndex(
      (node) => NodeTree.find(NodeTree.create(Node.children(node)), name).some,
    );
    if (hostIndex === -1) {
      return Option.none;
    }
    const host = tree.nodes[hostIndex];
    const updated = NodeTree.updateSiblingsOf(
      NodeTree.create(Node.children(host)),
      name,
      update,
    );
    if (!updated.some) {
      return Option.none;
    }
    return Option.some(
      NodeTree.create(
        tree.nodes.map((node, index) =>
          index === hostIndex
            ? { ...host, children: updated.value.nodes }
            : node,
        ),
      ),
    );
  },

  /**
   * 名前で指した親の子の並びを差し替える。
   * 親が子を持てないノードなら `children-not-allowed`、親が見つからなければ `none`。
   */
  updateChildrenOf(
    tree: NodeTree,
    parentName: string,
    update: NodeTreeUpdate,
  ): Result<Option<NodeTree>, NodeTreeEditError> {
    const parentIndex = tree.nodes.findIndex(
      (node) => node.name === parentName,
    );
    if (parentIndex !== -1) {
      const parent = tree.nodes[parentIndex];
      if (!NodeTree.allowsChildren(parent)) {
        return Result.err({ kind: "children-not-allowed", name: parentName });
      }
      return Result.map(
        update(NodeTree.create(Node.children(parent))),
        (children) =>
          Option.some(
            NodeTree.create(
              tree.nodes.map((node, index) =>
                index === parentIndex
                  ? { ...parent, children: children.nodes }
                  : node,
              ),
            ),
          ),
      );
    }

    const hostIndex = tree.nodes.findIndex(
      (node) =>
        NodeTree.find(NodeTree.create(Node.children(node)), parentName).some,
    );
    if (hostIndex === -1) {
      return Result.ok(Option.none);
    }
    const host = tree.nodes[hostIndex];
    return Result.map(
      NodeTree.updateChildrenOf(
        NodeTree.create(Node.children(host)),
        parentName,
        update,
      ),
      (updated) =>
        updated.some
          ? Option.some(
              NodeTree.create(
                tree.nodes.map((node, index) =>
                  index === hostIndex
                    ? { ...host, children: updated.value.nodes }
                    : node,
                ),
              ),
            )
          : Option.none,
    );
  },

  /** 名前で指したノードを並びから取り除く。見つからなければ `none`。 */
  removeByName(tree: NodeTree, name: string): Option<NodeTree> {
    return NodeTree.updateSiblingsOf(tree, name, (siblings) =>
      NodeTree.create(
        siblings.nodes.filter((sibling) => sibling.name !== name),
      ),
    );
  },

  /** 名前で指したノードを別のノードに差し替える。見つからなければ `none`。 */
  replaceByName(tree: NodeTree, name: string, node: Node): Option<NodeTree> {
    return NodeTree.updateSiblingsOf(tree, name, (siblings) =>
      NodeTree.create(
        siblings.nodes.map((sibling) =>
          sibling.name === name ? node : sibling,
        ),
      ),
    );
  },
} as const;

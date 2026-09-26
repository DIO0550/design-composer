import type { ChildPosition } from "@/domains/dcmp/child-position";
import { Node } from "@/domains/dcmp/node";
import { PrimitiveSchema } from "@/domains/dcmp/primitive-schema";
import { ArrayEx, type IndexOutOfRange } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * 同じ親を共有するノードの並び。ツリーの一階層を表す。
 *
 * artboard の `children`・ノードの `children`・部品の `children` はいずれもこの形で、「並
 * びの中を探す」「並びを編集する」規則は入れ物によらず同じなのでここに集める。
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

/**
 * 並びの中の 1 件の子の並びを差し替える。
 *
 * @param tree 差し替える対象を含む並び
 * @param index 子の並びを差し替えるノードの位置
 * @param children 差し替え後の子の並び
 * @returns `index` 番目のノードだけ子の並びが入れ替わった、`tree` と同じ階層の並び
 */
function withChildrenAt(
  tree: NodeTree,
  index: number,
  children: NodeTree,
): NodeTree {
  return NodeTree.create(
    tree.nodes.map((node, current) =>
      current === index ? { ...node, children: children.nodes } : node,
    ),
  );
}

export const NodeTree = {
  /**
   * そのノードが子を持てるか（プリミティブで、かつスキーマが子を認めているか）。
   *
   * @param node 見るノード
   * @returns スキーマが子を認めているプリミティブなら `true`。参照ノードと、スキーマに無い
   *   `type` のノードは `false`
   */
  allowsChildren(node: Node): boolean {
    return Node.isPrimitive(node) && PrimitiveSchema.allowsChildren(node.type);
  },

  /**
   * ノードの並びを、ツリーの一階層として見る。
   *
   * @param nodes 同じ親を共有するノードの並び。複製せずにそのまま持つ
   * @returns `nodes` を並びとして持つツリー
   */
  create(nodes: readonly Node[]): NodeTree {
    return { nodes };
  },

  /**
   * 並びを配列として取り出す。入れ物（artboard / ノード）へ書き戻すときに使う。
   *
   * @param tree 取り出す元のツリー
   * @returns ツリーが持っている並びそのもの（複製しない）
   */
  nodes(tree: NodeTree): readonly Node[] {
    return tree.nodes;
  },

  /**
   * 名前でノードを探し、それが「どの親の何番目か」を返す。並びの子孫も辿る。
   *
   * 並び自体の入れ物（artboard / ノード）の名前は外から与える。
   *
   * @param tree 探す先の並び
   * @param parentName `tree` の入れ物（artboard / ノード）の名前。直下で見つかったときの親
   *   になる
   * @param name 探すノードの名前
   * @returns 見つかったノードの親の名前と、その親の子の並びの中の位置。探す順は `find` と
   *   同じ（深さ優先の行きがけ順）で、名前が重複した不正なドキュメントでも `find` が返す
   *   ノードの位置になる。`parentName` 自身や、どこにも無い名前なら `none`
   */
  childPositionOf(
    tree: NodeTree,
    parentName: string,
    name: string,
  ): Option<ChildPosition> {
    for (const [index, node] of tree.nodes.entries()) {
      if (node.name === name) {
        return Option.some({ parentName, index });
      }
      const found = NodeTree.childPositionOf(
        NodeTree.create(Node.children(node)),
        node.name,
        name,
      );
      if (Option.isSome(found)) {
        return found;
      }
    }
    return Option.none;
  },

  /**
   * 名前でノードを探す。並びの直下だけでなく子孫も辿る。
   *
   * @param tree 探す先の並び
   * @param name 探すノードの名前
   * @returns その名前を持つノード。並びのノードを順に `Node.find` で辿るので、名前が重複した
   *   不正なドキュメントでは深さ優先の行きがけ順で先に見つかったもの。どこにも無ければ `none`
   */
  find(tree: NodeTree, name: string): Option<Node> {
    for (const node of tree.nodes) {
      const found = Node.find(node, name);
      if (Option.isSome(found)) {
        return found;
      }
    }
    return Option.none;
  },

  /**
   * 並びの指定位置へノードを挿入する。子孫は辿らず、渡された並びの中だけを見る。
   *
   * @param tree 挿入する先の並び
   * @param index 挿入する位置。並びの長さなら末尾へ足す
   * @param node 挿入するノード
   * @returns 挿入したあとの並び。位置の条件は `ArrayEx.insertAt` と同じで、外れていれば
   *   `index-out-of-range`
   */
  insertAt(
    tree: NodeTree,
    index: number,
    node: Node,
  ): Result<NodeTree, NodeTreeEditError> {
    return toTreeResult(ArrayEx.insertAt(tree.nodes, index, node));
  },

  /**
   * 並びの中の 1 件を抜き出し、別の位置へ差し込む。子孫は辿らず、渡された並びの中だけを
   * 見る。
   *
   * @param tree 動かす先の並び
   * @param fromIndex 動かすノードの、動かす前の位置
   * @param toIndex 動かしたあとにそのノードが来る位置
   * @returns 動かしたあとの並び。位置の条件は `ArrayEx.moveWithin` と同じで、外れていれば
   *   `index-out-of-range`
   */
  moveWithin(
    tree: NodeTree,
    fromIndex: number,
    toIndex: number,
  ): Result<NodeTree, NodeTreeEditError> {
    return toTreeResult(ArrayEx.moveWithin(tree.nodes, fromIndex, toIndex));
  },

  /**
   * 名前で指したノードを持つ並びを差し替える。対象が子孫にある場合はその階層の並びだけを
   * 差し替え、見つからなければ `none`。
   *
   * @param tree 探す先の並び
   * @param name 差し替える並びに含まれているはずのノードの名前
   * @param update 見つかった階層の並びを差し替える手続き
   * @returns その階層を `update` の結果に差し替えた、`tree` と同じ階層の並び。探す順は
   *   `find` と同じ（深さ優先の行きがけ順）で、名前が重複した不正なドキュメントでも `find` が
   *   返すノードを含む並びを差し替える。どこにも無ければ `none`
   */
  updateSiblingsOf(
    tree: NodeTree,
    name: string,
    update: (siblings: NodeTree) => NodeTree,
  ): Option<NodeTree> {
    for (const [hostIndex, host] of tree.nodes.entries()) {
      if (host.name === name) {
        return Option.some(update(tree));
      }
      const updated = NodeTree.updateSiblingsOf(
        NodeTree.create(Node.children(host)),
        name,
        update,
      );
      if (Option.isSome(updated)) {
        return Option.some(withChildrenAt(tree, hostIndex, updated.value));
      }
    }
    return Option.none;
  },

  /**
   * 名前で指した親の子の並びを差し替える。
   * 親が子を持てないノードなら `children-not-allowed`、親が見つからなければ `none`。
   *
   * @param tree 探す先の並び
   * @param parentName 子の並びを差し替える親のノードの名前
   * @param update 親の子の並びを差し替える手続き
   * @returns 親の子を `update` の結果に差し替えた、`tree` と同じ階層の並びの `some`。親は
   *   `find` と同じ順（深さ優先の行きがけ順）で探すので、名前が重複した不正なドキュメント
   *   でも `find` が返すノードを親にする。親が見つからなければ `none` の `ok`。親が参照ノード
   *   か、スキーマが子を認めていないプリミティブなら `children-not-allowed`、`update` が
   *   失敗すればその `err`
   */
  updateChildrenOf(
    tree: NodeTree,
    parentName: string,
    update: NodeTreeUpdate,
  ): Result<Option<NodeTree>, NodeTreeEditError> {
    for (const [index, node] of tree.nodes.entries()) {
      const children = NodeTree.create(Node.children(node));
      if (node.name === parentName) {
        if (!NodeTree.allowsChildren(node)) {
          return Result.err({ kind: "children-not-allowed", name: parentName });
        }
        return Result.map(update(children), (updated) =>
          Option.some(withChildrenAt(tree, index, updated)),
        );
      }
      const updated = NodeTree.updateChildrenOf(children, parentName, update);
      // 失敗も「この部分木で親が見つかった」ことなので、次の兄弟へ進まずに返す
      const settled = !Result.isOk(updated) || Option.isSome(updated.value);
      if (settled) {
        return Result.map(updated, (found) =>
          Option.map(found, (subtree) => withChildrenAt(tree, index, subtree)),
        );
      }
    }
    return Result.ok(Option.none);
  },

  /**
   * 並びの中の 1 件を、別の 0 件以上のノードに置き換える。子孫は辿らず、渡された並びの
   * 中だけを見る。
   *
   * 取り除く（0 件）・差し替える（1 件）・包みを外して子を出す（子の件数）はどれもこの形
   * なので、走査と名前の突き合わせをここ 1 つにまとめている。
   *
   * @param siblings 置き換える対象を含む並び
   * @param name 置き換えるノードの名前
   * @param replacements その位置へ置く並び。空なら取り除く
   * @returns 置き換えたあとの並び。名前が重複した不正なドキュメントでも置き換えるのは並びで
   *   先の 1 件だけ（`updateSiblingsOf` が行きがけ順で当てるノードと同じ）。名前が並びに
   *   無ければそのまま
   */
  spliceByName(
    siblings: NodeTree,
    name: string,
    replacements: readonly Node[],
  ): NodeTree {
    const index = siblings.nodes.findIndex((sibling) => sibling.name === name);
    return NodeTree.create(
      siblings.nodes.flatMap((sibling, current) =>
        current === index ? replacements : [sibling],
      ),
    );
  },

  /**
   * 名前で指したノードを並びから取り除く。見つからなければ `none`。
   *
   * @param tree 探す先の並び
   * @param name 取り除くノードの名前
   * @returns 取り除いたあとの、`tree` と同じ階層の並び。探し方は `updateSiblingsOf`、見つかった
   *   階層での取り除き方は `spliceByName` と同じ
   */
  removeByName(tree: NodeTree, name: string): Option<NodeTree> {
    return NodeTree.updateSiblingsOf(tree, name, (siblings) =>
      NodeTree.spliceByName(siblings, name, []),
    );
  },

  /**
   * 名前で指したノードを別のノードに差し替える。見つからなければ `none`。
   *
   * @param tree 探す先の並び
   * @param name 差し替えられるノードの名前
   * @param node その位置へ置くノード
   * @returns 差し替えたあとの、`tree` と同じ階層の並び。探し方は `updateSiblingsOf`、見つかった
   *   階層での差し替え方は `spliceByName` と同じ
   */
  replaceByName(tree: NodeTree, name: string, node: Node): Option<NodeTree> {
    return NodeTree.updateSiblingsOf(tree, name, (siblings) =>
      NodeTree.spliceByName(siblings, name, [node]),
    );
  },
} as const;

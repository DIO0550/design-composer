import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { SiblingPlacements } from "@/domains/dcmp/sibling-placements";
import type { NodeTemplate } from "@/domains/session/node-template";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 名前で指したノードそれぞれの、自分と子孫の名前を合わせたもの。
 *
 * @param document 名前の引き先になるドキュメント
 * @param names 占めている名前を知りたいノードの名前
 * @returns 指した順に、自分と子孫の名前を並べたもの。1 つでもドキュメントに無い名前があれば
 *   `none`
 */
function occupiedNamesOf(
  document: DesignDocument,
  names: readonly string[],
): Option<readonly string[]> {
  const nodes = ArrayEx.filterMap(names, (name) =>
    DesignDocument.findNode(document, name),
  );
  return nodes.length === names.length
    ? Option.some(nodes.flatMap(Node.collectNames))
    : Option.none;
}

/**
 * ツリーの中へ落とすこともあるもの（docs/06-ui.md「キャンバス直接操作」の移動と、
 * 「編集操作の一覧」の挿入）。木にある既存ノード 1 つか、パレットの雛形。
 *
 * 選んでいるものをまとめて運ぶとき（`DraggedNode` の `selected-siblings`）は座標の置き直しに
 * しかならないので、ツリーへ落とす経路（`DropEdit.intoTree`）はこの狭い型だけを受け取る。
 */
export type TreeDraggedNode =
  | Readonly<{ kind: "existing"; name: string }>
  | Readonly<{ kind: "new"; template: NodeTemplate }>;

/**
 * キャンバスへ落とすと木に現れるもの（docs/06-ui.md「キャンバス直接操作」の移動と、
 * 「編集操作の一覧」の挿入）。
 *
 * 木にある既存ノードを 1 つ運ぶ（移動）のと、選んでいる絶対配置の兄弟をまとめて運ぶ
 * （移動）のと、パレットの雛形を運ぶ（挿入）のとでは、離したときの操作も木の中で占めている
 * 場所も変わる。直和で列挙することで「名前と雛形の両方を持つ」「どれも持たない」指定を
 * 表現できなくする。
 */
export type DraggedNode =
  | TreeDraggedNode
  | Readonly<{ kind: "selected-siblings"; siblings: SiblingPlacements }>;

export const DraggedNode = {
  /**
   * 運んでいるものが今ツリーで占めている名前。
   *
   * 種別ごとに変わるのがこの値そのもので、既存ノードは自分と子孫を、まとめて運ぶ兄弟は
   * 全員とその子孫を占め、雛形はまだ木に無いので何も占めていない。落とし先の候補から外す
   * 名前を決めるのに使う（自分の子孫へ入れると木が壊れる）。
   *
   * @param dragged 運んでいるもの
   * @param document 名前の引き先になるドキュメント
   * @returns 占めている名前。雛形なら空。既存ノードの名前（まとめて運ぶなら一員のどれか 1 つ
   *   でも）がドキュメントに無ければ `none`
   */
  collectNames(
    dragged: DraggedNode,
    document: DesignDocument,
  ): Option<readonly string[]> {
    switch (dragged.kind) {
      case "new":
        return Option.some([]);
      case "existing":
        return occupiedNamesOf(document, [dragged.name]);
      case "selected-siblings":
        return occupiedNamesOf(
          document,
          SiblingPlacements.names(dragged.siblings),
        );
    }
  },

  /**
   * パレットから運んでいる雛形。
   *
   * @param dragged 運んでいるもの
   * @returns 雛形を運んでいるならその雛形。木にある既存ノードを運んでいるなら（まとめて運ぶ
   *   ときも）`none`
   */
  template(dragged: DraggedNode): Option<NodeTemplate> {
    switch (dragged.kind) {
      case "new":
        return Option.some(dragged.template);
      case "existing":
      case "selected-siblings":
        return Option.none;
    }
  },
} as const;

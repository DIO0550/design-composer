import { DesignDocument } from "@/domains/design-document";
import { Node } from "@/domains/node";
import type { NodeTemplate } from "@/domains/node-template";
import { Option } from "@/utils/Option";

/**
 * キャンバスへ落とすと木に現れるもの（docs/06-ui.md「キャンバス直接操作」の移動と、
 * 「編集操作の一覧」の挿入）。
 *
 * 木にある既存ノードを運ぶ（移動）のと、パレットの雛形を運ぶ（挿入）のとでは、
 * 離したときの操作も木の中で占めている場所も変わる。直和で列挙することで
 * 「名前と雛形の両方を持つ」「どちらも持たない」指定を表現できなくする。
 */
export type DraggedNode =
  | Readonly<{ kind: "existing"; name: string }>
  | Readonly<{ kind: "new"; template: NodeTemplate }>;

export const DraggedNode = {
  /**
   * 運んでいるものが今ツリーで占めている名前。
   *
   * 種別ごとに変わるのがこの値そのもので、既存ノードは自分と子孫を占め、雛形は
   * まだ木に無いので何も占めていない。落とし先の候補から外す名前を決めるのに使う
   * （自分の子孫へ入れると木が壊れる）。
   *
   * @param dragged 運んでいるもの
   * @param document 名前の引き先になるドキュメント
   * @returns 占めている名前。雛形なら空。既存ノードの名前がドキュメントに無ければ `none`
   */
  collectNames(
    dragged: DraggedNode,
    document: DesignDocument,
  ): Option<readonly string[]> {
    if (dragged.kind === "new") {
      return Option.some([]);
    }
    return Option.map(
      DesignDocument.findNode(document, dragged.name),
      Node.collectNames,
    );
  },

  /**
   * パレットから運んでいる雛形。
   *
   * @param dragged 運んでいるもの
   * @returns 雛形を運んでいるならその雛形。木にある既存ノードを運んでいるなら `none`
   */
  template(dragged: DraggedNode): Option<NodeTemplate> {
    return dragged.kind === "new" ? Option.some(dragged.template) : Option.none;
  },
} as const;

import { BoxElement } from "@/domains/compiled/compiled-element";
import { Artboard } from "@/domains/dcmp/artboard";
import type { CssDirection } from "@/domains/dcmp/css-direction";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { NodeTree } from "@/domains/dcmp/node-tree";
import { ResolvedProps } from "@/domains/dcmp/resolved-props";
import { Option } from "@/utils/Option";
import { DraggedNode } from "../dragged-node";

/**
 * ドロップ先の候補になれる親（docs/06-ui.md「キャンバス直接操作」の移動）。
 *
 * 向きを名前と対で持つのは、挿入位置がその向きの軸上でしか決まらないため
 * （どちらか片方だけでは「何番目の子になるか」を答えられない）。
 */
export type DropParent = Readonly<{
  name: string;
  direction: CssDirection;
}>;

/**
 * 名前と Box の props から、子を受け入れる親として読む。
 *
 * 向きを持たない親（`layout: free`）を候補にしないのは、**挿入位置が向きの軸上でしか
 * 決まらない**ため。自由配置の器へ座標で置く操作はドラッグの意味自体が別なので、
 * ここで「並び順のどこへ挿すか」に翻訳しない。
 *
 * @param name 親の名前
 * @param props 親を Box として解決した props
 * @returns 親の名前と子が並ぶ向き。子を並べない親なら `none`
 */
function dropParentFromBoxProps(
  name: string,
  props: ResolvedProps<"Box">,
): Option<DropParent> {
  return Option.map(BoxElement.childDirection(props), (direction) => ({
    name,
    direction,
  }));
}

/**
 * 子を持てるプリミティブは Box だけで、並ぶ向きはその `layout` prop で決まる（docs/03-schema.md）。
 *
 * @param node 親として読みたいノード
 * @returns 親の名前と子が並ぶ向き。子を持てないノード・子を並べない Box なら `none`
 */
function dropParentOfNode(node: Node): Option<DropParent> {
  if (!Node.isPrimitive(node) || !NodeTree.allowsChildren(node)) {
    return Option.none;
  }
  return dropParentFromBoxProps(
    node.name,
    ResolvedProps.resolve("Box", node.props ?? {}),
  );
}

/**
 * artboard は常に子を持てる。並ぶ向きは Box として解決した props が持つ。
 *
 * @param artboard 親として読みたい artboard
 * @returns 親の名前と子が並ぶ向き。子を並べない artboard なら `none`
 */
function dropParentOfArtboard(artboard: Artboard): Option<DropParent> {
  return dropParentFromBoxProps(artboard.name, Artboard.boxProps(artboard));
}

/**
 * その名前が指す artboard / ノードを、子を受け入れる親として読む。
 *
 * @param document 名前の引き先になるドキュメント
 * @param name 親として読みたい artboard / ノードの名前
 * @returns 親の名前と子が並ぶ向き。名前が無い場合と、子を持てないノード・
 *   子を並べない親なら `none`
 */
function dropParentOf(
  document: DesignDocument,
  name: string,
): Option<DropParent> {
  const artboard = DesignDocument.findArtboard(document, name);
  if (artboard.some) {
    return dropParentOfArtboard(artboard.value);
  }
  return Option.flatMap(
    DesignDocument.findNode(document, name),
    dropParentOfNode,
  );
}

export const DropParent = {
  /**
   * 内側から外へ並べた候補のうち、運んでいるものを受け入れられる最も内側のものを選ぶ。
   *
   * 受け入れられないのは次の4つで、いずれも候補から外して外側を見に行く。
   * - ドキュメントに無い名前（部品インスタンスの中身は定義側のノード名で描かれる）
   * - 子を持てないノード（Text・参照ノード）
   * - 子を並べない親（`layout: free`。挿入位置が向きの軸上でしか決まらない）
   * - 運んでいるものが占めている名前（入れるとツリーが壊れる。`DesignDocument.moveNode`
   *   も `move-into-descendant` として拒む）。占めている名前は運んでいるものの種別で
   *   変わるので `DraggedNode` が答える（パレットの雛形はまだ木に無いので何も占めない）
   *
   * 運んでいるノードの上を通ったときにその親が選ばれるのは、外へ辿った結果であって
   * 既定値へ倒しているわけではない（元の位置へ戻すのは正当な移動）。
   *
   * @param document 名前の引き先になるドキュメント
   * @param dragged 運んでいるもの
   * @param names ポインタの下から根へ向かう順の候補
   * @returns 受け入れられる最も内側の親。候補が1つも受け入れられない場合と、
   *   木に無いノードを運んでいる場合は `none`
   */
  innermost(
    document: DesignDocument,
    dragged: DraggedNode,
    names: readonly string[],
  ): Option<DropParent> {
    const occupied = DraggedNode.collectNames(dragged, document);
    if (!occupied.some) {
      return Option.none;
    }
    for (const name of names) {
      if (occupied.value.includes(name)) {
        continue;
      }
      const parent = dropParentOf(document, name);
      if (parent.some) {
        return parent;
      }
    }
    return Option.none;
  },
} as const;

import { Artboard } from "@/domains/artboard";
import { BoxElement } from "@/domains/compiled-element";
import type { CssDirection } from "@/domains/css-direction";
import { DesignDocument } from "@/domains/design-document";
import { Node } from "@/domains/node";
import { NodeTree } from "@/domains/node-tree";
import { ResolvedProps } from "@/domains/resolved-props";
import { Option } from "@/utils/Option";

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

/** 子を持てるプリミティブは Box だけで、並ぶ向きはその `direction` prop で決まる（docs/03-schema.md）。 */
function dropParentOfNode(node: Node): Option<DropParent> {
  if (!Node.isPrimitive(node) || !NodeTree.allowsChildren(node)) {
    return Option.none;
  }
  return Option.some({
    name: node.name,
    direction: BoxElement.childDirection(
      ResolvedProps.resolve("Box", node.props ?? {}),
    ),
  });
}

/** artboard は常に子を持てる。並ぶ向きは Box として解決した props が持つ。 */
function dropParentOfArtboard(artboard: Artboard): DropParent {
  return {
    name: artboard.name,
    direction: BoxElement.childDirection(Artboard.boxProps(artboard)),
  };
}

/** その名前が指す artboard / ノードを、子を受け入れる親として読む。 */
function dropParentOf(
  document: DesignDocument,
  name: string,
): Option<DropParent> {
  const artboard = DesignDocument.findArtboard(document, name);
  if (artboard.some) {
    return Option.some(dropParentOfArtboard(artboard.value));
  }
  return Option.flatMap(
    DesignDocument.findNode(document, name),
    dropParentOfNode,
  );
}

export const DropParent = {
  /**
   * 内側から外へ並べた候補のうち、掴んでいるノードを受け入れられる最も内側のものを選ぶ。
   *
   * 受け入れられないのは次の3つで、いずれも候補から外して外側を見に行く。
   * - ドキュメントに無い名前（部品インスタンスの中身は定義側のノード名で描かれる）
   * - 子を持てないノード（Text・参照ノード）
   * - 掴んでいるノード自身とその子孫（入れるとツリーが壊れる。`DesignDocument.moveNode`
   *   も `move-into-descendant` として拒む）
   *
   * 掴んでいるノードの上を通ったときにその親が選ばれるのは、外へ辿った結果であって
   * 既定値へ倒しているわけではない（元の位置へ戻すのは正当な移動）。
   */
  innermost(
    document: DesignDocument,
    heldName: string,
    names: readonly string[],
  ): Option<DropParent> {
    const held = DesignDocument.findNode(document, heldName);
    if (!held.some) {
      return Option.none;
    }
    const heldSubtree = Node.collectNames(held.value);
    for (const name of names) {
      if (heldSubtree.includes(name)) {
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

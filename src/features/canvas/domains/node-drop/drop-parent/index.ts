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
 * ドロップ先の候補になれる親（docs/06-ui.md「キャンバス直接操作」の移動）。受け入れる条件は `DropParent.innermost`、絞り込んだ先は `InsertionParent`。
 *
 * 名前だけなので `{ name: string }` を持つ他の型（`CarriedNode` / `ParentShift`）も構造的に代入できるが、ブランドは付けない。取り違えは
 * `artboard-canvas.drag-placement` の通しテストが受け持つ（rules/coding.md「防ぎたい誤用が実際にコード上へ現れてから導入する」）。
 */
export type DropParent = Readonly<{
  name: string;
}>;

/**
 * 子が並ぶ向きまで分かる親。外す条件は `InsertionParent.innermost`。
 *
 * `DropParent` と別の型にするのは、**向きを持たない親を挿入位置の計算へ渡せなくする**ため
 * （rules/coding.md「処理の通過を型に刻む」）。
 */
export type InsertionParent = Readonly<{
  name: string;
  direction: CssDirection;
}>;

/** 落とし先の親を探すのに要るもの。 */
type ParentSearchContext = Readonly<{
  document: DesignDocument;
  dragged: DraggedNode;
  /** ポインタの下から根へ向かう順の候補 */
  names: readonly string[];
}>;

/**
 * その名前が指す artboard / ノードを、子を受け入れる親として Box の props で読む。
 *
 * artboard は常に子を持てる。ノードで子を持てるのは Box だけで、並ぶ向きもその
 * `layout` prop で決まる（docs/03-schema.md）。
 *
 * @param document 名前の引き先になるドキュメント
 * @param name 親として読みたい artboard / ノードの名前
 * @returns 親として解決した Box の props。ドキュメントに無い名前と、
 *   子を持てないノード（Text・参照ノード）なら `none`
 */
function parentBoxProps(
  document: DesignDocument,
  name: string,
): Option<ResolvedProps<"Box">> {
  const artboard = DesignDocument.findArtboard(document, name);
  if (artboard.some) {
    return Option.some(Artboard.boxProps(artboard.value));
  }
  return Option.flatMap(DesignDocument.findNode(document, name), (node) => {
    const holdsChildren =
      Node.isPrimitive(node) && NodeTree.allowsChildren(node);
    return holdsChildren
      ? Option.some(ResolvedProps.resolve("Box", node.props ?? {}))
      : Option.none;
  });
}

/**
 * 内側から外へ並べた候補のうち、運んでいるものを受け入れられる最も内側のものを選ぶ。
 *
 * どこまでを受け入れるかは `resolve` が答える（座標の置き直しと並びへの挿入で条件が違う）。
 * 走査そのもの（運んでいるものが占めている名前を飛ばし、外側を見に行く）は共通。
 *
 * @param search 引き先のドキュメント・運んでいるもの・内側から根へ向かう順の候補
 * @param resolve 候補を親として読む手続き
 * @returns 受け入れられる最も内側の親。候補が 1 つも受け入れられない場合と、
 *   木に無いノードを運んでいる場合は `none`
 */
function innermostAccepted<T>(
  search: ParentSearchContext,
  resolve: (document: DesignDocument, name: string) => Option<T>,
): Option<T> {
  const occupied = DraggedNode.collectNames(search.dragged, search.document);
  if (!occupied.some) {
    return Option.none;
  }
  for (const name of search.names) {
    if (occupied.value.includes(name)) {
      continue;
    }
    const parent = resolve(search.document, name);
    if (parent.some) {
      return parent;
    }
  }
  return Option.none;
}

/**
 * 子を受け入れられる親として読む。
 *
 * @param document 名前の引き先になるドキュメント
 * @param name 親として読みたい artboard / ノードの名前
 * @returns その親。ドキュメントに無い名前と、子を持てないノードなら `none`
 */
function dropParentOf(
  document: DesignDocument,
  name: string,
): Option<DropParent> {
  return Option.map(parentBoxProps(document, name), () => ({ name }));
}

/**
 * 子が並ぶ向きまで分かる親として読む。
 *
 * @param document 名前の引き先になるドキュメント
 * @param name 親として読みたい artboard / ノードの名前
 * @returns その親と子が並ぶ向き。`dropParentOf` が `none` になる場合に加えて、
 *   子を並べない親（`layout: free`）でも `none`
 */
function insertionParentOf(
  document: DesignDocument,
  name: string,
): Option<InsertionParent> {
  return Option.flatMap(parentBoxProps(document, name), (props) =>
    Option.map(BoxElement.childDirection(props), (direction) => ({
      name,
      direction,
    })),
  );
}

export const DropParent = {
  /**
   * 内側から外へ並べた候補のうち、運んでいるものを受け入れられる最も内側のものを選ぶ。受け入れられないのは次の 3 つで、いずれも候補から外して外側を見に行く。
   *
   * - ドキュメントに無い名前（部品インスタンスの中身は定義側のノード名で描かれる）
   * - 子を持てないノード（Text・参照ノード）
   * - 運んでいるものが占めている名前（入れるとツリーが壊れる。占めている名前は運んでいるものの種別で変わるので `DraggedNode` が答える）
   *
   * **子を並べない親（`layout: free`）はここでは外さない。** 座標の置き直しは親の左上を原点にするだけで子が並ぶ向きを必要とせず、`free` はそもそも絶対配置の子を
   * 座標で置くための器（docs/03-schema.md）。外すと、いちばん使う操作が器の宣言によって塞がれる（#440）。
   *
   * 運んでいるノードの上を通ったときにその親が選ばれるのは、外へ辿った結果であって既定値へ倒しているわけではない（元の位置へ戻すのは正当な移動）。
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
    return innermostAccepted({ document, dragged, names }, dropParentOf);
  },
} as const;

export const InsertionParent = {
  /**
   * 内側から外へ並べた候補のうち、運んでいるものを並びへ挿せる最も内側のものを選ぶ。
   *
   * `DropParent.innermost` が外す3つに加えて、**子を並べない親（`layout: free`）**も
   * 外して外側を見に行く。自由配置の器へ座標で置く操作はドラッグの意味自体が別なので、
   * ここで「並び順のどこへ挿すか」に翻訳しない。
   *
   * @param document 名前の引き先になるドキュメント
   * @param dragged 運んでいるもの
   * @param names ポインタの下から根へ向かう順の候補
   * @returns 並びへ挿せる最も内側の親。候補が1つも受け入れられない場合と、
   *   木に無いノードを運んでいる場合は `none`
   */
  innermost(
    document: DesignDocument,
    dragged: DraggedNode,
    names: readonly string[],
  ): Option<InsertionParent> {
    return innermostAccepted({ document, dragged, names }, insertionParentOf);
  },
} as const;

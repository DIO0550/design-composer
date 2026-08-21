import { DesignDocument } from "@/domains/design-document";
import { Node } from "@/domains/node";
import type { Option } from "@/utils/Option";

/**
 * 今の選択に対する部品化（UI 案 docs/Design Composer.html の `Assets` 下部にある
 * `Create component`）。
 *
 * できるかどうかを真偽値で持たず、できないときの**理由まで**を直和で列挙する。
 * UI 案がインスタンス選択時に `an instance can't be componentized` と理由を出しており、
 * 「できないが理由が無い」「できるのに元の名前が無い」という食い違った状態を
 * 表現できなくするため（rules/coding.md「不正な状態を型で表現できなくする」）。
 *
 * `sourceName` を `ready` だけが持つのがその境界で、`ready` 以外から元の名前は読めない。
 */
export type Componentization =
  | Readonly<{ kind: "ready"; sourceName: string }>
  | Readonly<{ kind: "instance" }>
  | Readonly<{ kind: "artboard" }>
  | Readonly<{ kind: "unselected" }>;

export const Componentization = {
  /**
   * 選択から、部品化できるかとできない理由を決める。
   *
   * 部品にできるかの判定を `Selection` の種別ではなく `Node.isRef` で行うのは、
   * 部品化を受理する条件（`Component.fromNode`）が「参照ノードでないこと」だけで、
   * `type` がスキーマに知られているかを見ないため。種別で判定すると、不正な
   * ドキュメントに残る未知の `type` のノードだけ部品にできなくなり、
   * ドメイン側の受理条件と静かにずれる。
   *
   * @param document 選択先を引くドキュメント
   * @param singleName 選ばれている 1 つの名前。何も選んでいない・複数選んでいるなら不在
   * @returns 部品にできるノードを選んでいるなら元の名前つきの `ready`、
   *   それ以外は選んでいるものを表す理由
   */
  forSelection(
    document: DesignDocument,
    singleName: Option<string>,
  ): Componentization {
    if (!singleName.some) {
      return { kind: "unselected" };
    }
    const name = singleName.value;
    const node = DesignDocument.findNode(document, name);
    if (node.some) {
      return Node.isRef(node.value)
        ? { kind: "instance" }
        : { kind: "ready", sourceName: name };
    }
    /*
     * ノードでないなら artboard かを引き直す。「ノードで無ければ artboard」と決め打つと、
     * ドキュメントに無い名前（消えたノードを指したままの選択など）が黙って artboard として
     * 扱われる。どちらでも無い名前は何も選んでいないのと同じなので `unselected` に落とす。
     */
    return DesignDocument.findArtboard(document, name).some
      ? { kind: "artboard" }
      : { kind: "unselected" };
  },
} as const;

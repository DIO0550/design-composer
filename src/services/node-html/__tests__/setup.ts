import type { ExpandedNode } from "@/domains/dcmp/expanded-node";
import { Result } from "@/utils/Result";
import type { ParentContext } from "../index";
import { NodeHtml } from "../index";

/**
 * ノードをコンパイルして style だけを取り出す。
 *
 * @param node コンパイル対象のノード
 * @param parent 親の並びの向き。親を持たない位置では省く
 * @returns その要素の style。コンパイルに失敗したらテストを落とす
 */
export function styleOf(
  node: ExpandedNode,
  parent?: ParentContext,
): Readonly<Record<string, string>> {
  return Result.unwrap(NodeHtml.compile(node, parent)).style;
}

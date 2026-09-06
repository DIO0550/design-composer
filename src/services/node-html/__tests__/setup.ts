import type { CssDirection } from "@/domains/dcmp/css-direction";
import type { ExpandedNode } from "@/domains/dcmp/expanded-node";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { NodeHtml } from "../index";

/**
 * ノードをコンパイルして style だけを取り出す。
 *
 * @param node コンパイル対象のノード
 * @param parentDirection 親が子を並べる向き。並べる親を持たない位置では省く
 * @returns その要素の style。コンパイルに失敗したらテストを落とす
 */
export function styleOf(
  node: ExpandedNode,
  parentDirection: Option<CssDirection> = Option.none,
): Readonly<Record<string, string>> {
  return Result.unwrap(NodeHtml.compile(node, parentDirection)).style;
}

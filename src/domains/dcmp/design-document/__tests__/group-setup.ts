import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node, type Props } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";

/**
 * 名前で引いたノードに書かれている props。
 *
 * @param document 引き先のドキュメント
 * @param name 引くノードの名前
 * @returns そのノードに書かれている props。props を持たないとき・部品インスタンスのときは空
 */
export function propsOf(document: DesignDocument, name: string): Props {
  const node = Option.unwrap(DesignDocument.findNode(document, name));
  return Node.isPrimitive(node) ? Node.propsOf(node) : {};
}

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
  return Node.writtenPropsOf(
    Option.unwrap(DesignDocument.findNode(document, name)),
  );
}

/**
 * 名前で指した artboard / ノードの子の名前。
 *
 * @param document 引き先のドキュメント
 * @param parentName 子を読みたい artboard / ノードの名前
 * @returns 子の名前を並び順のまま
 */
export function childNames(
  document: DesignDocument,
  parentName: string,
): readonly string[] {
  return Option.unwrap(DesignDocument.findChildren(document, parentName)).map(
    (child) => child.name,
  );
}

import type { ComponentSet } from "@/domains/dcmp/component";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { Node, type Props } from "@/domains/dcmp/node";
import type { NonEmptyArray } from "@/types/NonEmptyArray";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

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

/**
 * 画面の直下に、props を書いた panel を置き、その中にノードを並べたドキュメント。
 *
 * @param panelProps panel に書く props
 * @param children panel の中に並べるノード
 * @returns 1 つの artboard だけを持つドキュメント
 */
export function setupPanelDocument(
  panelProps: Props,
  children: readonly Node[],
): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "panel", type: "Box", props: panelProps, children }],
      },
    ],
  });
}

/**
 * 画面の直下にノードを並べたドキュメント。
 *
 * @param artboardProps 画面に書く props。省くと何も書かない
 * @param components ドキュメントの部品定義。省くと持たない
 * @param children 画面の直下に並べるノード
 * @returns 1 つの artboard だけを持つドキュメント
 */
export function setupArtboardDocument({
  artboardProps,
  components,
  children,
}: {
  artboardProps?: Props;
  components?: ComponentSet;
  children: readonly Node[];
}): DesignDocument {
  return DesignDocument.create({
    components,
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        ...(artboardProps === undefined ? {} : { props: artboardProps }),
        children,
      },
    ],
  });
}

/**
 * 名前で指したノードを box という名前の Box で包む。
 *
 * @param document 包む先のドキュメント
 * @param names 包むノードの名前
 * @returns 包んだあとのドキュメント
 */
export function group(
  document: DesignDocument,
  names: NonEmptyArray<string>,
): DesignDocument {
  return Result.unwrap(DesignDocument.groupIntoBox(document, names, "box"));
}

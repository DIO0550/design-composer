import type { ChildPosition } from "@/domains/dcmp/child-position";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 同じ親の兄弟として並んでいる、選んだノードたちの位置（docs/06-ui.md「複数選択」の並べ替え）。
 *
 * 親が 1 つに決まっていることと、位置が 1 つ以上あることを構造で持つ。位置は小さい順
 * （背面から前面へ）に並ぶ。
 */
export type SiblingPositions = Readonly<{
  /** 選んだノードすべての親の名前。 */
  parentName: string;
  /** 選んだノードそれぞれの、親の子の並びの中での位置。小さい順。 */
  indices: readonly [number, ...number[]];
}>;

export const SiblingPositions = {
  /**
   * 選んでいるノードがすべて同じ親の兄弟であるときの、それぞれの位置。
   *
   * @param selection 選択とドキュメントの出どころ
   * @returns 親と、小さい順に並べた位置。未選択のとき、位置を持たない名前（artboard 自身・
   *   部品定義の中のノード・ドキュメントに無い名前）が混ざるとき、親が 2 つ以上あるときは
   *   `none`
   */
  fromSelection(selection: DocumentSelection): Option<SiblingPositions> {
    const names = DocumentSelection.names(selection);
    const positions = names.flatMap((name): readonly ChildPosition[] => {
      const found = DesignDocument.findChildPosition(selection.document, name);
      return Option.isSome(found) ? [found.value] : [];
    });
    if (positions.length !== names.length) {
      return Option.none;
    }
    const indices = ArrayEx.sortBy(
      positions.map((position) => position.index),
      (index) => index,
    );
    return Option.flatMap(
      ArrayEx.singleDistinct(positions.map((position) => position.parentName)),
      (parentName) =>
        Option.map(
          ArrayEx.first(indices),
          (first): SiblingPositions => ({
            parentName,
            indices: [first, ...ArrayEx.dropFirst(indices)],
          }),
        ),
    );
  },
} as const;

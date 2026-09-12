import { NoMatchMessage } from "@/components/search-field";
import { Artboard } from "@/domains/dcmp/artboard";
import { DocumentSelection } from "@/domains/session/document-selection";
import { NameFilter } from "@/domains/session/name-filter";
import {
  ArtboardList,
  ArtboardListing,
  NoArtboardMessage,
} from "@/features/sidebar/components/artboard-list";
import { DocumentTree } from "@/features/sidebar/components/document-tree";
import type { LeftPaneArtboardActions } from "@/features/sidebar/types/LeftPaneArtboardActions";
import type { LeftPaneNodeActions } from "@/features/sidebar/types/LeftPaneNodeActions";
import type { LeftPaneRenameActions } from "@/features/sidebar/types/LeftPaneRenameActions";
import type { Option } from "@/utils/Option";

/**
 * 絞り込みに残った artboard。
 *
 * @param artboards ドキュメントが持つ並び
 * @param filter 名前を絞る条件
 * @returns 自分の名前か配下のノードが条件に合う artboard。絞っていなければ全部
 */
function matchedArtboards(
  artboards: readonly Artboard[],
  filter: Option<NameFilter>,
): readonly Artboard[] {
  if (!filter.some) {
    return artboards;
  }
  return artboards.filter((artboard) =>
    Artboard.hasMatchingName(artboard, (name) =>
      NameFilter.isMatch(filter.value, name),
    ),
  );
}

/**
 * 今見ている 1 枚を一覧へ戻した並び。
 *
 * ツリーが映すのはこの 1 枚なので、一致しなかったというだけで一覧から消すと、**一覧に
 * 無い artboard の中身をツリーが映す**状態になる（docs/06-ui.md「絞り込み」）。
 *
 * @param artboards ドキュメントが持つ並び
 * @param matched 絞り込みに残った並び
 * @param selection 今見ている 1 枚を読む対
 * @returns ドキュメントの順のまま、残ったものと今見ている 1 枚を並べたもの
 */
function withCurrentArtboard(
  artboards: readonly Artboard[],
  matched: readonly Artboard[],
  selection: DocumentSelection,
): readonly Artboard[] {
  const isKept = (artboard: Artboard) =>
    matched.includes(artboard) ||
    DocumentSelection.isCurrentArtboard(selection, artboard.name);
  return artboards.filter(isKept);
}

/**
 * 左ペインの `Layers`（UI 案 docs/Design Composer.html の `Artboards` の一覧とツリー）。
 * 検索語を条件へ変えて、2 つの節を同じ条件で絞る。
 *
 * 絞り込みを持つのはここだけ。一覧とツリーのそれぞれに検索語を配ると、同じ判定が 2 箇所
 * に出る（rules/coding.md）。下へ渡すのは絞り込み済みの並びと条件で、判定はここで 1 度
 * だけ行う。
 */
export function LayersPanel({
  query,
  selection,
  renaming,
  artboard,
  node,
  rename,
}: Readonly<{
  /** 検索欄に打たれた語。空なら絞っていない */
  query: string;
  selection: DocumentSelection;
  /** 今その名前を編集しているもの。編集していなければ不在 */
  renaming: Option<string>;
  artboard: LeftPaneArtboardActions;
  node: LeftPaneNodeActions;
  rename: LeftPaneRenameActions;
}>) {
  const filter = NameFilter.create(query);
  const artboards = selection.document.artboards;
  const matched = matchedArtboards(artboards, filter);
  /*
   * 絞り込んだ結果が 1 つも残らなかったか。artboard が 1 枚も無いのは絞り込みの結果では
   * ないので、そのときは一覧が元から持つ知らせのままにする（docs/06-ui.md「絞り込み」）。
   */
  const hasNoMatch =
    filter.some && artboards.length > 0 && matched.length === 0;

  const listing: ArtboardListing = filter.some
    ? {
        // 置き換えが勝つので、どこにも一致が無いときは今見ている 1 枚も残さない
        artboards: hasNoMatch
          ? []
          : withCurrentArtboard(artboards, matched, selection),
        emptyNotice: hasNoMatch ? NoMatchMessage : NoArtboardMessage,
        isReorderable: false,
      }
    : ArtboardListing.full(artboards);

  return (
    <>
      <ArtboardList
        listing={listing}
        selection={selection}
        renaming={renaming}
        onSelect={node.select}
        artboardActions={artboard}
        renameActions={rename}
      />
      {hasNoMatch ? null : (
        <DocumentTree
          selection={selection}
          renaming={renaming}
          filter={filter}
          onSelect={node.select}
          onReorder={node.reorder}
          renameActions={rename}
        />
      )}
    </>
  );
}

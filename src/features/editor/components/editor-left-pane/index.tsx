import type { ReactElement } from "react";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import type { TokenSelection } from "@/domains/session/token-selection";
import {
  type AssetGrab,
  AssetsPanel,
  CreateComponent,
} from "@/features/editor/features/assets";
import {
  LayersPanel,
  LeftPane,
  type LeftPaneView,
  type LeftPaneViewContent,
  LeftPaneViews,
} from "@/features/editor/features/sidebar";
import { TokenList } from "@/features/editor/features/tokens";
import type { ArtboardActions } from "@/features/editor/hooks/use-artboard-actions";
import type { NodeActions } from "@/features/editor/hooks/use-node-actions";
import type { TokenActions } from "@/features/editor/hooks/use-token-actions";
import { Option } from "@/utils/Option";

/**
 * 左ペイン（docs/06-ui.md「画面構成」）。行き先ごとの中身を組んで器へ差し込む。
 *
 * どの子 feature の部品をどの行き先へ出すかを決めるのはここ（`rules/consistency.md`
 * 「子 feature を繋ぐ方法」）。器（`features/editor/features/sidebar`）は引いて出すだけで、
 * 中身を知らない。
 *
 * **ドキュメントと選択の対・トークンの対は props で受け取る。** ここで導出し直すと、
 * 呼び出し側が 1 つだけ作って配っている対が毎レンダー作り直され、受け取る側が覚えた
 * ものが毎回捨てられる。
 *
 * @returns レールと、今の行き先の中身を出したパネル
 */
export function EditorLeftPane({
  view,
  onSelectView,
  selection,
  tokenSelection,
  renaming,
  isFrozen,
  node,
  artboard,
  token,
  grab,
}: Readonly<{
  view: LeftPaneView;
  onSelectView: (view: LeftPaneView) => void;
  selection: DocumentSelection;
  tokenSelection: TokenSelection;
  /** 今その名前を編集しているもの。編集していなければ不在 */
  renaming: Option<string>;
  isFrozen: boolean;
  node: NodeActions;
  artboard: ArtboardActions;
  token: TokenActions;
  grab: AssetGrab;
}>): ReactElement {
  /*
   * 行き先を 1 つ足すと `Record` が漏れをコンパイルエラーにする。この注釈を外すと
   * 保証が消え、足し忘れた行き先は黙って空のパネルになる。
   */
  const views: Readonly<Record<LeftPaneView, LeftPaneViewContent>> = {
    [LeftPaneViews.Layers]: {
      kind: "searchable",
      searchLabel: "Search layers",
      footer: Option.none,
      /*
        UI 案（docs/Design Composer.html）の `Layers` パネルは、見出しの直下に検索欄を
        置き、その下に artboard の一覧と、選んだ 1 枚の中身を並べる。プリミティブを挿す
        入口はキャンバスに浮かぶツールバーが持ち、部品はパレットの行を掴んで落とすので、
        どちらもここには並べない。
      */
      render: (query) => (
        <LayersPanel
          query={query}
          selection={selection}
          renaming={renaming}
          artboard={artboard}
          node={node}
          rename={{
            startAt: node.startRenamingAt,
            commit: node.rename,
            finish: node.finishRenaming,
            cancel: node.cancelRenaming,
          }}
        />
      ),
    },
    [LeftPaneViews.Assets]: {
      kind: "searchable",
      searchLabel: "Search assets",
      footer: Option.some(
        <CreateComponent
          document={selection.document}
          singleName={DocumentSelection.singleName(selection)}
          isFrozen={isFrozen}
          onCreate={node.createComponent}
        />,
      ),
      render: (query) => (
        <AssetsPanel
          query={query}
          assets={DesignDocument.componentAssets(selection.document)}
          sourceName={DocumentSelection.sourceName(selection)}
          grab={grab}
        />
      ),
    },
    [LeftPaneViews.Tokens]: {
      kind: "plain",
      footer: Option.none,
      render: () => (
        <TokenList
          selection={tokenSelection}
          onSelectToken={token.select}
          onAddToken={token.add}
        />
      ),
    },
  };

  return (
    <LeftPane
      view={view}
      onSelectView={onSelectView}
      views={views}
      isFrozen={isFrozen}
    />
  );
}

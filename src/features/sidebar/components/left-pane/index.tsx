import type { ReactElement } from "react";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import type { TokenSelection } from "@/domains/session/token-selection";
import {
  type AssetGrab,
  AssetsPanel,
  CreateComponent,
} from "@/features/assets";
import { LayersPanel } from "@/features/sidebar/components/layers-panel";
import { LeftPanePanel } from "@/features/sidebar/components/left-pane-panel";
import {
  LeftPaneRail,
  type LeftPaneView,
  LeftPaneViewLabels,
  LeftPaneViews,
} from "@/features/sidebar/components/left-pane-rail";
import type { LeftPaneArtboardActions } from "@/features/sidebar/types/LeftPaneArtboardActions";
import type { LeftPaneNodeActions } from "@/features/sidebar/types/LeftPaneNodeActions";
import type { LeftPaneRenameActions } from "@/features/sidebar/types/LeftPaneRenameActions";
import type { LeftPaneTokenActions } from "@/features/sidebar/types/LeftPaneTokenActions";
import { TokenList } from "@/features/tokens";
import { Option } from "@/utils/Option";

/**
 * 行き先ごとのパネルの中身。
 *
 * `ReactNode` は `undefined` を含むので、抜けても通ってしまい、足し忘れた行き先が黙って空
 * のパネルになる。
 *
 * @returns Layers なら artboard の一覧とツリー、Assets ならパレット、Tokens ならトークン一覧
 */
function LeftPaneContent({
  view,
  query,
  selection,
  renaming,
  tokenSelection,
  artboard,
  node,
  rename,
  token,
  grab,
}: Readonly<{
  view: LeftPaneView;
  /** 検索欄に打たれた語。欄を持たない行き先では空 */
  query: string;
  selection: DocumentSelection;
  renaming: Option<string>;
  tokenSelection: TokenSelection;
  artboard: LeftPaneArtboardActions;
  node: LeftPaneNodeActions;
  rename: LeftPaneRenameActions;
  token: LeftPaneTokenActions;
  grab: AssetGrab;
}>): ReactElement {
  switch (view) {
    case LeftPaneViews.Layers:
      return (
        /*
          UI 案（docs/Design Composer.html）の `Layers` パネルは、見出しの直下に検索欄を
          置き、その下に artboard の一覧と、選んだ 1 枚の中身を並べる。プリミティブを挿す
          入口はキャンバスに浮かぶツールバーが持ち、部品はパレットの行を掴んで落とすので、
          どちらもここには並べない。
        */
        <LayersPanel
          query={query}
          selection={selection}
          renaming={renaming}
          artboard={artboard}
          node={node}
          rename={rename}
        />
      );
    case LeftPaneViews.Assets:
      return (
        <AssetsPanel
          query={query}
          assets={DesignDocument.componentAssets(selection.document)}
          sourceName={DocumentSelection.sourceName(selection)}
          grab={grab}
        />
      );
    case LeftPaneViews.Tokens:
      return (
        <TokenList
          selection={tokenSelection}
          onSelectToken={token.select}
          onAddToken={token.add}
        />
      );
  }
}

/**
 * 行き先ごとの検索欄の案内文（UI 案 docs/Design Composer.html の綴り）。
 *
 * @param view 今の行き先
 * @returns 中身を絞れる行き先なら案内文。絞れない行き先では不在
 */
function searchLabelOf(view: LeftPaneView): Option<string> {
  switch (view) {
    case LeftPaneViews.Layers:
      return Option.some("Search layers");
    case LeftPaneViews.Assets:
      return Option.some("Search assets");
    case LeftPaneViews.Tokens:
      return Option.none;
  }
}

/**
 * 行き先ごとに、パネル下端へ固定するもの。
 *
 * @returns Assets なら部品化のフッター、他の行き先では不在
 */
function leftPaneFooter({
  view,
  selection,
  isFrozen,
  node,
}: Readonly<{
  /** 今の行き先 */
  view: LeftPaneView;
  /** 部品化の可否を決める選択の出どころ */
  selection: DocumentSelection;
  /** ファイルが不正で編集を受け付けないか */
  isFrozen: boolean;
  /** 部品化を送る先 */
  node: LeftPaneNodeActions;
}>): Option<ReactElement> {
  switch (view) {
    case LeftPaneViews.Layers:
      return Option.none;
    case LeftPaneViews.Assets:
      return Option.some(
        <CreateComponent
          document={selection.document}
          singleName={DocumentSelection.singleName(selection)}
          isFrozen={isFrozen}
          onCreate={node.createComponent}
        />,
      );
    case LeftPaneViews.Tokens:
      return Option.none;
  }
}

/**
 * 左ペイン（UI 案 docs/Design Composer.html は 56px のレールと 248px の見出し付きパネルを
 * 横に並べる）。レールで選んだ行き先の中身をパネルへ出す。
 *
 * ここが握ると右ペインから読めなくなるので、両ペインを組む側（`opened-document-editor`）に
 * 置いてもらう。
 */
export function LeftPane({
  view,
  onSelectView,
  selection,
  renaming,
  tokenSelection,
  isFrozen,
  artboard,
  node,
  rename,
  token,
  grab,
}: Readonly<{
  view: LeftPaneView;
  onSelectView: (view: LeftPaneView) => void;
  selection: DocumentSelection;
  /** 今その名前を編集しているもの。編集していなければ不在 */
  renaming: Option<string>;
  tokenSelection: TokenSelection;
  isFrozen: boolean;
  artboard: LeftPaneArtboardActions;
  node: LeftPaneNodeActions;
  rename: LeftPaneRenameActions;
  token: LeftPaneTokenActions;
  grab: AssetGrab;
}>) {
  return (
    <>
      <LeftPaneRail current={view} onSelect={onSelectView} />
      {/*
        行き先を `key` にして器ごと付け替える。検索語は非永続で、行き先を変えると空へ戻る
        （docs/06-ui.md「絞り込み」）。
      */}
      <LeftPanePanel
        key={view}
        title={LeftPaneViewLabels[view]}
        /*
         * ファイルが不正な間は操作を受け付けない（器の `EditorLayout.LeftPane` が
         * `inert` にする）ので、見出しでその旨を名乗る。UI 案 Error 画面の `frozen`。
         */
        note={isFrozen ? Option.some("凍結中") : Option.none}
        search={searchLabelOf(view)}
        footer={leftPaneFooter({ view, selection, isFrozen, node })}
      >
        {(query) => (
          <LeftPaneContent
            view={view}
            query={query}
            selection={selection}
            renaming={renaming}
            tokenSelection={tokenSelection}
            artboard={artboard}
            node={node}
            rename={rename}
            token={token}
            grab={grab}
          />
        )}
      </LeftPanePanel>
    </>
  );
}

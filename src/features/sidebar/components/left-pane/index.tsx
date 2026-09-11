import type { ReactElement } from "react";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import type { TokenSelection } from "@/domains/session/token-selection";
import {
  type AssetGrab,
  AssetsPanel,
  CreateComponent,
} from "@/features/assets";
import { ArtboardList } from "@/features/sidebar/components/artboard-list";
import { DocumentTree } from "@/features/sidebar/components/document-tree";
import { LeftPanePanel } from "@/features/sidebar/components/left-pane-panel";
import {
  LeftPaneRail,
  type LeftPaneView,
  LeftPaneViewLabels,
  LeftPaneViews,
} from "@/features/sidebar/components/left-pane-rail";
import type { LeftPaneArtboardActions } from "@/features/sidebar/types/LeftPaneArtboardActions";
import type { LeftPaneNodeActions } from "@/features/sidebar/types/LeftPaneNodeActions";
import type { LeftPaneTokenActions } from "@/features/sidebar/types/LeftPaneTokenActions";
import { TokenList } from "@/features/tokens";
import { Option } from "@/utils/Option";

/**
 * 行き先ごとのパネルの中身。
 *
 * `ReactNode` は `undefined` を含むので、抜けても通ってしまい、足し忘れた行き先が黙って空
 * のパネルになる。
 *
 * @returns Layers ならツリー、Assets ならパレット、Tokens ならトークン一覧
 */
function LeftPaneContent({
  view,
  selection,
  tokenSelection,
  artboard,
  node,
  token,
  grab,
}: Readonly<{
  view: LeftPaneView;
  selection: DocumentSelection;
  tokenSelection: TokenSelection;
  artboard: LeftPaneArtboardActions;
  node: LeftPaneNodeActions;
  token: LeftPaneTokenActions;
  grab: AssetGrab;
}>): ReactElement {
  switch (view) {
    case LeftPaneViews.Layers:
      return (
        <>
          {/*
            UI 案（docs/Design Composer.html）の `Layers` パネルは、artboard の一覧を
            上段に、選んだ 1 枚の中身を下段に置く。プリミティブを挿す入口はキャンバスに
            浮かぶツールバーが持ち、部品はパレットの行を掴んで落とすので、
            どちらもここには並べない。
          */}
          <ArtboardList
            selection={selection}
            onSelect={node.select}
            artboardActions={artboard}
          />
          <DocumentTree
            selection={selection}
            onSelect={node.select}
            onReorder={node.reorder}
          />
        </>
      );
    case LeftPaneViews.Assets:
      return (
        <AssetsPanel
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
  tokenSelection,
  isFrozen,
  artboard,
  node,
  token,
  grab,
}: Readonly<{
  view: LeftPaneView;
  onSelectView: (view: LeftPaneView) => void;
  selection: DocumentSelection;
  tokenSelection: TokenSelection;
  isFrozen: boolean;
  artboard: LeftPaneArtboardActions;
  node: LeftPaneNodeActions;
  token: LeftPaneTokenActions;
  grab: AssetGrab;
}>) {
  return (
    <>
      <LeftPaneRail current={view} onSelect={onSelectView} />
      <LeftPanePanel
        title={LeftPaneViewLabels[view]}
        /*
         * ファイルが不正な間は操作を受け付けない（器の `EditorLayout.LeftPane` が
         * `inert` にする）ので、見出しでその旨を名乗る。UI 案 Error 画面の `frozen`。
         */
        note={isFrozen ? Option.some("凍結中") : Option.none}
        footer={leftPaneFooter({ view, selection, isFrozen, node })}
      >
        <LeftPaneContent
          view={view}
          selection={selection}
          tokenSelection={tokenSelection}
          artboard={artboard}
          node={node}
          token={token}
          grab={grab}
        />
      </LeftPanePanel>
    </>
  );
}

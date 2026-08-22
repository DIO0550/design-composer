import type { ReactElement } from "react";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import type { TokenSelection } from "@/domains/token-selection";
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
import type { LeftPaneNodeActions } from "@/features/sidebar/types/LeftPaneNodeActions";
import type { LeftPaneTokenActions } from "@/features/sidebar/types/LeftPaneTokenActions";
import { TokenList } from "@/features/tokens";
import { Option } from "@/utils/Option";

/**
 * 行き先ごとのパネルの中身。
 *
 * 戻り値を `ReactElement`（`ReactNode` ではない）と書いているのは、行き先を足して
 * `case` を足し忘れたときに「返さない経路がある」としてコンパイルエラーにするため。
 * `ReactNode` は `undefined` を含むので、抜けても通ってしまい、足し忘れた行き先が
 * 黙って空のパネルになる。
 *
 * @returns Layers ならツリー、Assets ならパレット、Tokens ならトークン一覧
 */
function LeftPaneContent({
  view,
  selection,
  tokenSelection,
  node,
  token,
  grab,
}: Readonly<{
  view: LeftPaneView;
  selection: DocumentSelection;
  tokenSelection: TokenSelection;
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
            浮かぶツールバーが持ち（#112）、部品はパレットの行を掴んで落とす（#203）ので、
            どちらもここには並べない。
          */}
          <ArtboardList selection={selection} onSelect={node.select} />
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
 * 本体（`LeftPaneContent`）と分けているのは、UI 案が `Create component` を
 * スクロールしない帯として置いているため。中身と同じ `switch` に混ぜると
 * 一覧と一緒に流れる。
 *
 * 不在を `undefined` ではなく `Option` にしているのは、行き先を足して `case` を
 * 足し忘れたときにコンパイルエラーにするため（`ReactElement | undefined` だと
 * 抜けても通ってしまう）。
 *
 * @param view 今の行き先
 * @param selection 部品化の可否を決める選択の出どころ
 * @param isFrozen ファイルが不正で編集を受け付けないか
 * @param node 部品化を送る先
 * @returns Assets なら部品化のフッター、他の行き先では不在
 */
function leftPaneFooter(
  view: LeftPaneView,
  selection: DocumentSelection,
  isFrozen: boolean,
  node: LeftPaneNodeActions,
): Option<ReactElement> {
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
 * 左ペイン（UI 案 docs/Design Composer.html は 56px のレールと 248px の見出し付き
 * パネルを横に並べる / #129）。レールで選んだ行き先の中身をパネルへ出す。
 *
 * どこを見ているか（`view`）を自分で持たないのは、右ペインに何を出すかも同じ行き先で
 * 決まるため。ここが握ると右ペインから読めなくなるので、両ペインを組む側に置いて
 * もらう（`opened-document-editor`）。
 *
 * 編集画面の状態（`EditorState`）ではなく値で受け取るのは、この feature が編集画面を
 * 知らずに描けるようにするため（`features/sidebar/index.ts`）。
 */
export function LeftPane({
  view,
  onSelectView,
  selection,
  tokenSelection,
  isFrozen,
  node,
  token,
  grab,
}: Readonly<{
  view: LeftPaneView;
  onSelectView: (view: LeftPaneView) => void;
  selection: DocumentSelection;
  tokenSelection: TokenSelection;
  isFrozen: boolean;
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
        footer={leftPaneFooter(view, selection, isFrozen, node)}
      >
        <LeftPaneContent
          view={view}
          selection={selection}
          tokenSelection={tokenSelection}
          node={node}
          token={token}
          grab={grab}
        />
      </LeftPanePanel>
    </>
  );
}

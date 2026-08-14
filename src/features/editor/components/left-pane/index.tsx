import type { ReactElement } from "react";
import { DesignDocument } from "@/domains/design-document";
import { ArtboardList } from "@/features/editor/components/artboard-list";
import { AssetsPanel } from "@/features/editor/components/assets-panel";
import { CreateComponent } from "@/features/editor/components/create-component";
import { DocumentTree } from "@/features/editor/components/document-tree";
import { LeftPanePanel } from "@/features/editor/components/left-pane-panel";
import {
  LEFT_PANE_VIEW_LABELS,
  LEFT_PANE_VIEWS,
  LeftPaneRail,
  type LeftPaneView,
} from "@/features/editor/components/left-pane-rail";
import { TokenList } from "@/features/editor/components/token-list";
import { EditorState } from "@/features/editor/domains/editor-state";
import { SelectionControls } from "@/features/editor/domains/prop-control";
import type { NodeActions } from "@/features/editor/hooks/use-node-actions";
import type { TokenActions } from "@/features/editor/hooks/use-token-actions";
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
  state,
  node,
  token,
}: Readonly<{
  view: LeftPaneView;
  state: EditorState;
  node: NodeActions;
  token: TokenActions;
}>): ReactElement {
  switch (view) {
    case LEFT_PANE_VIEWS.layers:
      return (
        <>
          {/*
            UI 案（docs/Design Composer.html）の `Layers` パネルは、artboard の一覧を
            上段に、選んだ 1 枚の中身を下段に置く。挿入の入口はキャンバスに浮かぶ
            ツールバーへ移した（#112）ので、ここには並べない。
          */}
          <ArtboardList state={state} onSelect={node.select} />
          <DocumentTree
            state={state}
            onSelect={node.select}
            onReorder={node.reorder}
          />
        </>
      );
    case LEFT_PANE_VIEWS.assets:
      return (
        <AssetsPanel
          assets={DesignDocument.componentAssets(EditorState.document(state))}
          sourceName={Option.flatMap(
            SelectionControls.forSelection(state),
            SelectionControls.sourceName,
          )}
          isInsertEnabled={node.isInsertEnabled}
          onInsert={node.insertInstance}
        />
      );
    case LEFT_PANE_VIEWS.tokens:
      return (
        <TokenList
          state={state}
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
 * @param state 部品化の可否を決める選択の出どころ
 * @param node 部品化を送る先
 * @returns Assets なら部品化のフッター、他の行き先では不在
 */
function leftPaneFooter(
  view: LeftPaneView,
  state: EditorState,
  node: NodeActions,
): Option<ReactElement> {
  switch (view) {
    case LEFT_PANE_VIEWS.layers:
      return Option.none;
    case LEFT_PANE_VIEWS.assets:
      return Option.some(
        <CreateComponent state={state} onCreate={node.createComponent} />,
      );
    case LEFT_PANE_VIEWS.tokens:
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
 */
export function LeftPane({
  view,
  onSelectView,
  state,
  node,
  token,
}: Readonly<{
  view: LeftPaneView;
  onSelectView: (view: LeftPaneView) => void;
  state: EditorState;
  node: NodeActions;
  token: TokenActions;
}>) {
  return (
    <>
      <LeftPaneRail current={view} onSelect={onSelectView} />
      <LeftPanePanel
        title={LEFT_PANE_VIEW_LABELS[view]}
        /*
         * ファイルが不正な間は操作を受け付けない（器の `EditorLayout.LeftPane` が
         * `inert` にする）ので、見出しでその旨を名乗る。UI 案 Error 画面の `frozen`。
         */
        note={
          EditorState.isFileInvalid(state) ? Option.some("凍結中") : Option.none
        }
        footer={leftPaneFooter(view, state, node)}
      >
        <LeftPaneContent view={view} state={state} node={node} token={token} />
      </LeftPanePanel>
    </>
  );
}

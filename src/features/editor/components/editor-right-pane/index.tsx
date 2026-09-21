import type { ReactElement, ReactNode } from "react";
import { PaneBody } from "@/components/pane-body";
import { PaneHeading } from "@/components/pane-heading";
import { EditorState } from "@/features/editor/domains/editor-state";
import { PropertyPanel } from "@/features/editor/features/inspector";
import {
  type LeftPaneView,
  LeftPaneViews,
} from "@/features/editor/features/sidebar";
import { TokenEditor } from "@/features/editor/features/tokens";
import type { NodeActions } from "@/features/editor/hooks/use-node-actions";
import type { TokenActions } from "@/features/editor/hooks/use-token-actions";

/**
 * 右ペインの帯と本文に出すもの。器（`PaneHeading` / `PaneBody`）は呼び出し側が
 * 着せるので、ここが持つのは中身だけ。
 */
type RightPaneParts = Readonly<{ title: ReactNode; body: ReactElement }>;

/**
 * 行き先ごとの右ペインの中身。
 *
 * @returns Tokens ならトークンの編集欄、Layers / Assets ならプロパティパネル
 */
/** 右ペインの中身を決めるのに要るもの。 */
type RightPaneSource = Readonly<{
  view: LeftPaneView;
  state: EditorState;
  node: NodeActions;
  token: TokenActions;
  onGoToSource: () => void;
}>;

/**
 * 行き先ごとの右ペインの中身。
 *
 * @param source 出し分けに要る行き先とエディタの状態、操作の受け口
 * @returns Tokens ならトークンの編集欄、Layers / Assets ならプロパティパネル
 */
function rightPaneParts({
  view,
  state,
  node,
  token,
  onGoToSource,
}: RightPaneSource): RightPaneParts {
  const isFrozen = EditorState.isFileInvalid(state);
  const documentSelection = EditorState.documentSelection(state);
  const inspector: RightPaneParts = {
    title: <PropertyPanel.Title selection={documentSelection} />,
    body: (
      <PropertyPanel.Body
        selection={documentSelection}
        isFrozen={isFrozen}
        onEditProp={node.editProp}
        onClearSelection={node.clearSelection}
        instance={{
          goToSource: onGoToSource,
          selectAllInstances: node.selectAllInstances,
          detach: node.detachInstance,
        }}
      />
    ),
  };

  /*
   * 凍結は行き先より先に見る。ファイルが不正な間はトークンも編集できないので、
   * Tokens を開いたまま壊れたときに編集欄が残らないようにする。
   * プロパティパネルが凍結時の中身（「選択は凍結中」）を持つ。
   */
  if (isFrozen) {
    return inspector;
  }

  const tokenSelection = EditorState.tokenSelection(state);

  switch (view) {
    case LeftPaneViews.Tokens:
      return {
        title: <TokenEditor.Title selection={tokenSelection} />,
        body: (
          <TokenEditor.Body
            selection={tokenSelection}
            onSetTokenValue={token.setValue}
            onRenameToken={token.rename}
            onRemoveToken={token.remove}
          />
        ),
      };
    case LeftPaneViews.Layers:
    case LeftPaneViews.Assets:
      return inspector;
  }
}

/**
 * 右ペイン（docs/06-ui.md「画面構成」）。行き先に応じた中身に、帯と本文の器を着せる。
 *
 * どのペインに何を着せるかは 3 ペインの組み立ての判断で、中身を持つ feature は持たない
 * （`features/editor/features/inspector/index.ts` / `features/editor/features/tokens/index.ts`
 * の doc）。
 *
 * 選んでいなくても帯は残すので、中身が空でも `PaneHeading` ごと外さない。外すと選択の
 * たびに本文の位置が帯のぶん動く。
 *
 * @param props 出し分けへそのまま渡すもの
 * @returns 帯と本文の器を着せた右ペインの中身
 */
export function EditorRightPane(props: RightPaneSource): ReactElement {
  const parts = rightPaneParts(props);
  return (
    <>
      <PaneHeading>{parts.title}</PaneHeading>
      <PaneBody>{parts.body}</PaneBody>
    </>
  );
}

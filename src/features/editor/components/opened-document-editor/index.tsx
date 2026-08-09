import { type ReactElement, useState } from "react";
import { ArtboardCanvas } from "@/features/editor/components/artboard-canvas";
import { DocumentErrorList } from "@/features/editor/components/document-error-list";
import { DocumentSyncFailureList } from "@/features/editor/components/document-sync-failure-list";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import { LeftPane } from "@/features/editor/components/left-pane";
import {
  LEFT_PANE_VIEWS,
  type LeftPaneView,
} from "@/features/editor/components/left-pane-rail";
import { NodeInsertToolbar } from "@/features/editor/components/node-insert-toolbar";
import { PropertyPanel } from "@/features/editor/components/property-panel";
import { TokenEditor } from "@/features/editor/components/token-editor";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { OpenedDocument } from "@/features/editor/domains/opened-document";
import { useAutoSave } from "@/features/editor/hooks/use-auto-save";
import { useDocumentReload } from "@/features/editor/hooks/use-document-reload";
import { useEditShortcuts } from "@/features/editor/hooks/use-edit-shortcuts";
import {
  type NodeActions,
  useNodeActions,
} from "@/features/editor/hooks/use-node-actions";
import {
  type TokenActions,
  useTokenActions,
} from "@/features/editor/hooks/use-token-actions";
import type { DocumentIpc } from "@/libs/document-ipc";

/**
 * 行き先ごとの右ペインの中身。`Assets` がプロパティパネルのままなのは、パレットは
 * 見るだけの場所で選択に触れないため
 * （UI 案「Assets is browse-only — the inspector keeps the previous selection」）。
 *
 * 戻り値を `ReactElement` と書いている理由は `LeftPaneContent` と同じ
 * （`case` の足し忘れをコンパイルエラーにする）。
 */
function RightPaneContent({
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
    case LEFT_PANE_VIEWS.tokens:
      return (
        <TokenEditor
          state={state}
          onSetTokenValue={token.setValue}
          onRenameToken={token.rename}
          onRemoveToken={token.remove}
        />
      );
    case LEFT_PANE_VIEWS.layers:
    case LEFT_PANE_VIEWS.assets:
      return (
        <PropertyPanel
          state={state}
          onEditProp={node.editProp}
          onClearSelection={node.clearSelection}
        />
      );
  }
}

/**
 * Provider から状態を読んで各ペインへ配る。
 * 読み出しをここ 1 箇所に集めることで、ペインは props だけで描ける
 * （個別に単体描画・テストできる）。
 */
function EditorPanes() {
  const { state } = useEditor();
  const node = useNodeActions();
  const token = useTokenActions();
  /**
   * 左ペインが何を映しているか（UI 案 docs/Design Composer.html のアイコンレール）。
   * 右ペインに出すのもこれで決まる（Tokens ならトークン編集、それ以外はプロパティ）。
   * 編集とは連動しない表示だけの状態なので `EditorState` には持たせず、
   * 両ペインを組むここに置く。
   */
  const [leftPaneView, setLeftPaneView] = useState<LeftPaneView>(
    LEFT_PANE_VIEWS.layers,
  );
  const hasErrors = state.errors.length > 0;
  useEditShortcuts();

  return (
    <EditorLayout>
      <EditorLayout.LeftPane>
        <LeftPane
          view={leftPaneView}
          onSelectView={setLeftPaneView}
          state={state}
          node={node}
          token={token}
        />
      </EditorLayout.LeftPane>
      <EditorLayout.CenterPane>
        <ArtboardCanvas
          state={state}
          onSelect={node.selectAt}
          onMoveNode={node.move}
          onResize={node.resize}
          onEditProp={node.editProp}
        />
        {/*
          下端を占めるのはどちらか一方。UI 案も、浮かぶツールバーを持つ 4 画面と
          エラー一覧をドッキングする Error 画面とに分かれている（Design notes の文章は
          ツールバーが「凍結」と読めるが、マークアップに無いのでそちらに従った）。
        */}
        {hasErrors ? (
          <DocumentErrorList errors={state.errors} />
        ) : (
          <NodeInsertToolbar
            isInsertEnabled={node.isInsertEnabled}
            onInsert={node.insert}
          />
        )}
      </EditorLayout.CenterPane>
      <EditorLayout.RightPane>
        <RightPaneContent
          view={leftPaneView}
          state={state}
          node={node}
          token={token}
        />
      </EditorLayout.RightPane>
    </EditorLayout>
  );
}

/**
 * 開いているファイルとの同期（自動保存と外部変更の取り込み）を張り、3 ペインと
 * その失敗の表示を組み立てる（docs/05-architecture.md「保存モデル: 自動保存」
 * 「外部編集の検知」）。
 *
 * 器（Provider）の中に置くのは、同期の相手が「今表示しているドキュメント」であり、
 * それを読めるのが Provider の内側だけだから。
 */
function EditorBody({
  ipc,
  path,
}: Readonly<{ ipc: DocumentIpc; path: string }>) {
  const { state, dispatch } = useEditor();

  const autoSaveFailure = useAutoSave({
    ipc,
    path,
    document: EditorState.document(state),
  });
  const watchFailure = useDocumentReload({
    ipc,
    path,
    onReload: (reload) => dispatch({ type: "reload_document", reload }),
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DocumentSyncFailureList
        autoSave={autoSaveFailure}
        watch={watchFailure}
      />
      <EditorPanes />
    </div>
  );
}

/**
 * 開いているドキュメントの編集画面（docs/06-ui.md「画面構成」）。
 *
 * 状態の器（Provider）と中身の組み立てだけを持つ。
 */
export function OpenedDocumentEditor({
  ipc,
  opened,
}: Readonly<{ ipc: DocumentIpc; opened: OpenedDocument }>) {
  return (
    <EditorProvider initialDocument={opened.document}>
      <EditorBody ipc={ipc} path={opened.path} />
    </EditorProvider>
  );
}

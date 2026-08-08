import { useState } from "react";
import { DesignDocument } from "@/domains/design-document";
import { ArtboardCanvas } from "@/features/editor/components/artboard-canvas";
import { ComponentList } from "@/features/editor/components/component-list";
import { DocumentErrorList } from "@/features/editor/components/document-error-list";
import { DocumentSyncFailureList } from "@/features/editor/components/document-sync-failure-list";
import { DocumentTree } from "@/features/editor/components/document-tree";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import {
  LEFT_PANE_TABS,
  type LeftPaneTab,
  LeftPaneTabs,
} from "@/features/editor/components/left-pane-tabs";
import { NodeEditToolbar } from "@/features/editor/components/node-edit-toolbar";
import { PropertyPanel } from "@/features/editor/components/property-panel";
import { TokenEditor } from "@/features/editor/components/token-editor";
import { TokenList } from "@/features/editor/components/token-list";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { OpenedDocument } from "@/features/editor/domains/opened-document";
import { useAutoSave } from "@/features/editor/hooks/use-auto-save";
import { useDocumentReload } from "@/features/editor/hooks/use-document-reload";
import { useEditShortcuts } from "@/features/editor/hooks/use-edit-shortcuts";
import { useNodeActions } from "@/features/editor/hooks/use-node-actions";
import { useTokenActions } from "@/features/editor/hooks/use-token-actions";
import type { DocumentIpc } from "@/libs/document-ipc";

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
   * 左ペインが何を映しているか（UI 案 docs/Design Composer.html のタブ）。
   * 右ペインに出すのもこれで決まる（Layers ならプロパティ、Tokens ならトークン編集）。
   * 編集とは連動しない表示だけの状態なので `EditorState` には持たせず、
   * 両ペインを組むここに置く。
   */
  const [leftPaneTab, setLeftPaneTab] = useState<LeftPaneTab>(
    LEFT_PANE_TABS.layers,
  );
  const isTokensTab = leftPaneTab === LEFT_PANE_TABS.tokens;

  useEditShortcuts();

  return (
    <EditorLayout>
      <EditorLayout.LeftPane>
        <LeftPaneTabs current={leftPaneTab} onSelect={setLeftPaneTab} />
        {isTokensTab ? (
          <TokenList
            state={state}
            onSelectToken={token.select}
            onAddToken={token.add}
          />
        ) : (
          <>
            <NodeEditToolbar
              isInsertEnabled={node.isInsertEnabled}
              isRemoveEnabled={node.isRemoveEnabled}
              onInsert={node.insert}
              onRemove={node.remove}
            />
            <DocumentTree
              state={state}
              onSelect={node.select}
              onReorder={node.reorder}
            />
            <ComponentList
              refCounts={DesignDocument.componentRefCounts(
                EditorState.document(state),
              )}
              isInsertEnabled={node.isInsertEnabled}
              onInsert={node.insertInstance}
            />
          </>
        )}
      </EditorLayout.LeftPane>
      <EditorLayout.CenterPane>
        <ArtboardCanvas
          state={state}
          onSelect={node.selectAt}
          onMoveNode={node.move}
          onResize={node.resize}
          onEditProp={node.editProp}
        />
        <DocumentErrorList errors={state.errors} />
      </EditorLayout.CenterPane>
      <EditorLayout.RightPane>
        {isTokensTab ? (
          <TokenEditor
            state={state}
            onSetTokenValue={token.setValue}
            onRenameToken={token.rename}
            onRemoveToken={token.remove}
          />
        ) : (
          <PropertyPanel
            state={state}
            onEditProp={node.editProp}
            onClearSelection={node.clearSelection}
          />
        )}
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

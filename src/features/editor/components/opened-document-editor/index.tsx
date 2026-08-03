import type { ChildPosition } from "@/domains/design-document";
import { ArtboardCanvas } from "@/features/editor/components/artboard-canvas";
import { ComponentList } from "@/features/editor/components/component-list";
import { DocumentErrorList } from "@/features/editor/components/document-error-list";
import { DocumentSyncStatus } from "@/features/editor/components/document-sync-status";
import { DocumentTree } from "@/features/editor/components/document-tree";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import { PropertyPanel } from "@/features/editor/components/property-panel";
import type { OpenedDocument } from "@/features/editor/domains/opened-document";
import type { DocumentIpc } from "@/libs/document-ipc";

/**
 * Provider から状態を読んで各ペインへ配る。
 * 読み出しをここ 1 箇所に集めることで、ペインは props だけで描ける
 * （個別に単体描画・テストできる）。
 */
function EditorPanes() {
  const { state, dispatch } = useEditor();
  const selectNode = (name: string) => dispatch({ type: "select", name });
  const reorderNode = (from: ChildPosition, toIndex: number) =>
    dispatch({ type: "reorder_node", from, toIndex });

  return (
    <EditorLayout>
      <EditorLayout.LeftPane>
        <DocumentTree
          state={state}
          onSelect={selectNode}
          onReorder={reorderNode}
        />
        <ComponentList components={state.document.components} />
      </EditorLayout.LeftPane>
      <EditorLayout.CenterPane>
        <ArtboardCanvas state={state} onSelect={selectNode} />
        <DocumentErrorList errors={state.errors} />
      </EditorLayout.CenterPane>
      <EditorLayout.RightPane>
        <PropertyPanel
          state={state}
          onClearSelection={() => dispatch({ type: "clear_selection" })}
        />
      </EditorLayout.RightPane>
    </EditorLayout>
  );
}

/**
 * 開いているドキュメントの編集画面（docs/06-ui.md「画面構成」）。
 *
 * 状態の器（Provider）と 3 ペイン、そして開いているファイルとの同期の組み立てだけを持つ。
 */
export function OpenedDocumentEditor({
  ipc,
  opened,
}: Readonly<{ ipc: DocumentIpc; opened: OpenedDocument }>) {
  return (
    <EditorProvider initialDocument={opened.document}>
      <div className="flex h-full min-h-0 flex-col">
        <DocumentSyncStatus ipc={ipc} path={opened.path} />
        <EditorPanes />
      </div>
    </EditorProvider>
  );
}

import type { DocumentSelection } from "@/domains/document-selection";
import type { TokenSelection } from "@/domains/token-selection";
import type { NodeDragControl } from "@/features/canvas/hooks/use-node-drag";
import type { NodeResizeControl } from "@/features/canvas/hooks/use-node-resize";
import type { TextEditControl } from "@/features/canvas/hooks/use-text-edit";
import type { CompiledDocument } from "@/services/document-html";
import type { Result } from "@/utils/Result";
import { ArtboardFrameList } from "../artboard-frame-list";

/**
 * キャンバスに出す中身。コンパイルの失敗はそのまま表示する
 * （空表示へ倒すと、artboard が無いのかコンパイルが壊れているのか区別できなくなる）。
 */
export function CanvasBody({
  compiled,
  selection,
  tokenSelection,
  onSelect,
  nodeDrag,
  nodeResize,
  textEdit,
}: Readonly<{
  compiled: Result<CompiledDocument, Error>;
  selection: DocumentSelection;
  tokenSelection: TokenSelection;
  onSelect: (names: readonly string[]) => void;
  nodeDrag: NodeDragControl;
  nodeResize: NodeResizeControl;
  textEdit: TextEditControl;
}>) {
  if (!compiled.ok) {
    return (
      <p className="p-8 text-red-700 text-sm">
        コンパイルに失敗しました: {compiled.error.message}
      </p>
    );
  }
  if (compiled.value.artboards.length === 0) {
    return <p className="p-8 text-gray-500 text-sm">artboard がありません</p>;
  }
  return (
    <ArtboardFrameList
      compiled={compiled.value}
      selection={selection}
      tokenSelection={tokenSelection}
      onSelect={onSelect}
      nodeDrag={nodeDrag}
      nodeResize={nodeResize}
      textEdit={textEdit}
    />
  );
}

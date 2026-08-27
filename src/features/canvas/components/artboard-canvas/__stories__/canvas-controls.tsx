import type { ReactElement } from "react";
import type { DocumentSelection } from "@/domains/session/document-selection";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import {
  type NodeDragControl,
  useNodeDrag,
} from "@/features/canvas/hooks/use-node-drag";
import {
  type NodeResizeControl,
  useNodeResize,
} from "@/features/canvas/hooks/use-node-resize";
import {
  type TextEditControl,
  useTextEdit,
} from "@/features/canvas/hooks/use-text-edit";

/**
 * キャンバスの部品が受け取る 3 つの操作の口。
 *
 * `ArtboardCanvas` の内側の部品はどれもこの 3 つを受け取るが、いずれもフックの
 * 戻り値なので story の `args` には書けない。組み立てをここへ 1 つ置き、
 * 各 story は子を組む関数だけを渡す。
 */
export type CanvasControls = Readonly<{
  nodeDrag: NodeDragControl;
  nodeResize: NodeResizeControl;
  textEdit: TextEditControl;
}>;

/**
 * 3 つの口を本物のフックから組み立てて子へ渡す。
 *
 * story のためにフックを差し替えないのは、差し替えると story が確かめているものが
 * 本番の配線から離れるため（VRT が見ているのは本番と同じ組み立ての結果であってほしい）。
 *
 * @param selection 落とし先の解決とリサイズハンドルの算出に使う、ドキュメントと選択の対
 * @param children 組み立てた 3 つの口を受け取って中身を返す関数
 * @returns `children` が組んだ中身
 */
export function WithCanvasControls({
  selection,
  children,
}: Readonly<{
  selection: DocumentSelection;
  children: (controls: CanvasControls) => ReactElement;
}>): ReactElement {
  const nodeDrag = useNodeDrag({
    document: selection.document,
    onMove: () => {},
    onInsertAt: () => {},
  });
  const nodeResize = useNodeResize({
    selection,
    view: CanvasView.create(),
    onResize: () => {},
  });
  const textEdit = useTextEdit({ selection, onEditProp: () => {} });
  return children({ nodeDrag, nodeResize, textEdit });
}

import type { ReactElement } from "react";
import type { DocumentSelection } from "@/domains/session/document-selection";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { NodeResize } from "@/features/editor/features/canvas/domains/node-resize";
import {
  type AltPointingControl,
  useAltPointing,
} from "@/features/editor/features/canvas/hooks/use-alt-pointing";
import {
  type ArtboardDragControl,
  useArtboardDrag,
} from "@/features/editor/features/canvas/hooks/use-artboard-drag";
import {
  type NodeDragControl,
  useNodeDrag,
} from "@/features/editor/features/canvas/hooks/use-node-drag";
import {
  type NodeResizeControl,
  useNodeResize,
} from "@/features/editor/features/canvas/hooks/use-node-resize";
import {
  type TextEditControl,
  useTextEdit,
} from "@/features/editor/features/canvas/hooks/use-text-edit";

/**
 * キャンバスの部品が受け取る 5 つの操作の口。
 *
 * `ArtboardCanvas` の内側の部品はどれもこの 5 つを受け取るが、いずれもフックの
 * 戻り値なので story の `args` には書けない。組み立てをここへ 1 つ置き、
 * 各 story は子を組む関数だけを渡す。
 */
export type CanvasControls = Readonly<{
  artboardDrag: ArtboardDragControl;
  nodeDrag: NodeDragControl;
  nodeResize: NodeResizeControl;
  textEdit: TextEditControl;
  altPointing: AltPointingControl;
}>;

/**
 * 5 つの口を本物のフックから組み立てて子へ渡す。
 *
 * @param selection 落とし先の解決とリサイズハンドルの算出に使う、ドキュメントと選択の対
 * @param children 組み立てた 5 つの口を受け取って中身を返す関数
 * @returns `children` が組んだ中身
 */
export function WithCanvasControls({
  selection,
  children,
}: Readonly<{
  selection: DocumentSelection;
  children: (controls: CanvasControls) => ReactElement;
}>): ReactElement {
  const artboardDrag = useArtboardDrag({
    document: selection.document,
    view: CanvasView.create(),
    onReposition: () => {},
  });
  const nodeDrag = useNodeDrag({
    selection,
    view: CanvasView.create(),
    onMove: () => {},
    onInsertAt: () => {},
    onReposition: () => {},
  });
  const nodeResize = useNodeResize({
    resizable: NodeResize.resizable(selection),
    selection,
    view: CanvasView.create(),
    onResize: () => {},
  });
  const textEdit = useTextEdit({ selection, onEditProp: () => {} });
  const altPointing = useAltPointing();
  return children({
    artboardDrag,
    nodeDrag,
    nodeResize,
    textEdit,
    altPointing,
  });
}

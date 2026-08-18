import type { ReactElement } from "react";
import { CanvasView } from "@/features/editor/domains/canvas-view";
import { EditorState } from "@/features/editor/domains/editor-state";
import {
  type NodeDragControl,
  useNodeDrag,
} from "@/features/editor/hooks/use-node-drag";
import {
  type NodeResizeControl,
  useNodeResize,
} from "@/features/editor/hooks/use-node-resize";
import {
  type TextEditControl,
  useTextEdit,
} from "@/features/editor/hooks/use-text-edit";

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
 * @param state 落とし先の解決とリサイズハンドルの算出に使う編集状態
 * @param children 組み立てた 3 つの口を受け取って中身を返す関数
 * @returns `children` が組んだ中身
 */
export function WithCanvasControls({
  state,
  children,
}: Readonly<{
  state: EditorState;
  children: (controls: CanvasControls) => ReactElement;
}>): ReactElement {
  const nodeDrag = useNodeDrag({
    document: EditorState.document(state),
    onMove: () => {},
    onInsertAt: () => {},
  });
  const nodeResize = useNodeResize({
    state,
    view: CanvasView.create(),
    onResize: () => {},
  });
  const textEdit = useTextEdit({ state, onEditProp: () => {} });
  return children({ nodeDrag, nodeResize, textEdit });
}

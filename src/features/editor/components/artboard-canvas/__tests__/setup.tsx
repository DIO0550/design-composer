import { render } from "@testing-library/react";
import { vi } from "vitest";
import type { AxisLength } from "@/domains/axis-length";
import type { ChildPosition } from "@/domains/child-position";
import type { PropEdit } from "@/domains/node";
import type { EditorState } from "@/features/editor/domains/editor-state";
import { useCanvasView } from "@/features/editor/hooks/use-canvas-view";
import { ArtboardCanvas } from "../index";

/** キャンバスが外へ渡す操作。テストは見たいものだけを渡し、残りは呼ばれても何もしない。 */
type CanvasHandlers = Readonly<{
  onSelect: (names: readonly string[]) => void;
  onMoveNode: (name: string, to: ChildPosition) => void;
  onResize: (size: AxisLength) => void;
  onEditProp: (edit: PropEdit) => void;
}>;

/**
 * 表示（倍率・位置）を自分で持つキャンバス。
 * 本番は上部バーと 1 つの表示を共有するが（`OpenedDocumentEditor`）、
 * キャンバス単体の振る舞いは共有相手に依らないので、ここでは自前で持たせる。
 */
function CanvasWithView(
  props: Readonly<{ state: EditorState }> & CanvasHandlers,
) {
  const canvasView = useCanvasView();
  return <ArtboardCanvas {...props} canvasView={canvasView} />;
}

/**
 * キャンバスを描く。
 *
 * @param props 描く状態と、確かめたい操作だけのハンドラ
 * @returns `render` の戻り値
 */
export function renderCanvas(
  props: Readonly<{ state: EditorState }> & Partial<CanvasHandlers>,
) {
  return render(
    <CanvasWithView
      onSelect={vi.fn()}
      onMoveNode={vi.fn()}
      onResize={vi.fn()}
      onEditProp={vi.fn()}
      {...props}
    />,
  );
}

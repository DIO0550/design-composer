import { render } from "@testing-library/react";
import { vi } from "vitest";
import type { AxisLength } from "@/domains/axis-length";
import type { ChildPosition } from "@/domains/child-position";
import type { PropEdit } from "@/domains/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { useCanvasView } from "@/features/editor/hooks/use-canvas-view";
import { useNodeDrag } from "@/features/editor/hooks/use-node-drag";
import { ArtboardCanvas } from "../index";

/** キャンバスが外へ渡す操作。テストは見たいものだけを渡し、残りは呼ばれても何もしない。 */
type CanvasHandlers = Readonly<{
  onSelect: (names: readonly string[]) => void;
  onMoveNode: (name: string, to: ChildPosition) => void;
  onResize: (size: AxisLength) => void;
  onEditProp: (edit: PropEdit) => void;
}>;

/**
 * 表示（倍率・位置）とツリー内の移動 / 挿入のドラッグを自分で持つキャンバス。
 *
 * 本番はどちらも編集画面が持ち（`OpenedDocumentEditor`）、運んでいる間のポインタは
 * 3 ペインの器が受ける。掴む場所がパレット（左ペイン）にもあるためで、キャンバス単体の
 * 振る舞いはその共有相手に依らないので、ここでは器の役目まで自前で持たせる
 * （`canvasView` を自前で持つのと同じ扱い）。
 * **パレットから運ぶ経路はここでは通らない**ので、そちらは編集画面のテストが見る
 * （`opened-document-editor.asset-drag`）。器への配線が本番で外れていても、
 * そちらが落ちる。
 *
 * Why not: 同じ形が `index.stories.tsx` にもあるが、1 箇所へ寄せていない。
 * このファイルは `vitest` の `vi` を import しており、story から読むと Storybook の
 * バンドルへ `vitest` が入る。逆に story 側へ寄せるとテストが Storybook に依存する。
 */
function CanvasWithView(
  props: Readonly<{ state: EditorState }> & CanvasHandlers,
) {
  const canvasView = useCanvasView();
  const nodeDrag = useNodeDrag({
    document: EditorState.document(props.state),
    onMove: props.onMoveNode,
    onInsertAt: () => {},
  });
  return (
    <div {...nodeDrag.dragHandlers}>
      <ArtboardCanvas {...props} canvasView={canvasView} nodeDrag={nodeDrag} />
    </div>
  );
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

/**
 * キャンバスへ差し込まれた CSS 規則をすべて繋いだもの。
 *
 * 選択の枠もリサイズハンドルも、キャンバスの中身が React の管理外にあるため
 * `<style>` として差し込まれる（`NameStyleRule` / `ResizeHandleStyle`）。
 * 出ているかどうかはここを読むしかない。
 */
export function injectedStyles(): string {
  return Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent ?? "")
    .join("");
}

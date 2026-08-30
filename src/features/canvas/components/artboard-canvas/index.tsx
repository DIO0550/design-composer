import { type CSSProperties, useMemo } from "react";
import type { AxisLength } from "@/domains/dcmp/axis-length";
import type { PropEdit } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/session/document-selection";
import type { TokenSelection } from "@/domains/session/token-selection";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import { NodeDrag } from "@/features/canvas/domains/node-drag";
import { NodeResize } from "@/features/canvas/domains/node-resize";
import type { CanvasViewControl } from "@/features/canvas/hooks/use-canvas-view";
import type { NodeDragControl } from "@/features/canvas/hooks/use-node-drag";
import { useNodeResize } from "@/features/canvas/hooks/use-node-resize";
import { useTextEdit } from "@/features/canvas/hooks/use-text-edit";
import { DocumentHtml } from "@/services/document-html";
import { CanvasBody } from "./canvas-body";
import { DropMarker } from "./drop-marker";
import { DropPositionLabel } from "./drop-position-label";
import { ResizeHandleStyle } from "./resize-handle-style";
import { StaleCanvasOverlay } from "./stale-canvas-overlay";
import { TextInlineEditor } from "./text-inline-editor";

/*
 * 中身は部品ごとにサブフォルダへ分けてある（`rules/architecture.md`
 * 「複数ファイルへの分割が必要になったら…サブフォルダに分割する」）。
 * ここに残すのはキャンバスそのものの組み立てだけ。
 */

/** キャンバスの強調規則の綴りを、テストが写さずに引けるようにする（定義側の doc を参照）。 */
export { TokenReferrerOutline } from "./artboard-frame-list";

/** 拡大の基準を左上に固定する（中央基準だと倍率を変えるたびに並びの原点が動く）。 */
const ContentTransformOrigin: CSSProperties["transformOrigin"] = "0 0";

/**
 * キャンバス（docs/06-ui.md「画面構成」）。
 * artboard を配列順に自動配置し、コンパイル結果（実 HTML / CSS）をレンダリングする。
 * ズーム / パンは非永続の view state で、ドキュメントには保存しない。
 *
 * 表示（倍率・位置）を自分で持たず受け取るのは、倍率の操作が上部バーへ移り、
 * キャンバスと上部バーが同じ 1 つの表示を見る必要があるため（#134）。
 *
 * props が 8 つあるが Composition へは割っていない。関心は「キャンバス」1 つで、
 * 前半 3 つは描くのに要る値、後半 5 つは表示とキャンバス上の操作を外へ渡す口。
 * 中身を子要素として受け取る形にはできない（描くものはコンパイル結果の HTML で、
 * 呼び出し側が組み立てられない）。`EditorState` を丸ごと受けると feature として
 * 切り出せない（#256）。
 *
 * `isFrozen` を真偽値のまま受けるのは、凍結の取りうる状態が 2 つしかないため。
 * 中央ペインの凍結（ハンドルの抑止・`inert`・スクリム）はここが自分で出す
 * （左右のペインと違い、器の `EditorLayout` は中央に淡色も `inert` も付けない。
 * 映っているものは最後に正常だった表示なので、見る操作だけは残す）。
 *
 * `selection` と `tokenSelection` がそれぞれドキュメントを持つが、束ねる型は作らない。
 * トークンの対を単独で受けている `TokenList` / `TokenEditor` と流儀が割れるため。
 * 同じドキュメントを指すことは、両方を 1 つの状態から作る呼び出し側が保つ。
 *
 * ツリー内の移動 / 挿入のドラッグを自分で持たず受け取るのは、掴む場所がキャンバスだけで
 * なくなったため。パレット（左ペイン）からも掴めるので、状態は両方の親が持つ
 * （`opened-document-editor`）。
 */
export function ArtboardCanvas({
  selection,
  tokenSelection,
  isFrozen,
  canvasView,
  nodeDrag,
  onSelect,
  onResize,
  onEditProp,
}: Readonly<{
  selection: DocumentSelection;
  tokenSelection: TokenSelection;
  isFrozen: boolean;
  canvasView: CanvasViewControl;
  nodeDrag: NodeDragControl;
  onSelect: (names: readonly string[]) => void;
  onResize: (size: AxisLength) => void;
  onEditProp: (edit: PropEdit) => void;
}>) {
  const { view, surfaceRef, panHandlers } = canvasView;
  const designDocument = selection.document;
  const nodeResize = useNodeResize({ selection, view, onResize });
  const textEdit = useTextEdit({ selection, onEditProp });
  /*
   * 凍結中はリサイズハンドルを出さない。`inert` の中にあって掴めないのに、
   * 掴める帯だけが普段どおり見えることになるため。選択の枠そのものは残す
   * （何を選んでいたかは右ペインの見出しと揃えて保つ）。
   */
  const resizeHandles = isFrozen ? [] : NodeResize.handles(selection);
  const singleName = DocumentSelection.singleName(selection);
  /*
   * 覚える相手はドキュメントであって対ではない。`selection` を deps にすると
   * **選択のたびに**コンパイルし直して中身の HTML を入れ直すので、`click` 2 回の
   * あとのダブルクリックが入れ替わった木へ飛んで届かなくなる
   * （`opened-document-editor.text-edit` が 3 件落ちる）。性能ではなく振る舞いの話。
   */
  const compiled = useMemo(
    () => DocumentHtml.compile(designDocument),
    [designDocument],
  );
  const dropTarget = NodeDrag.insertionTarget(nodeDrag.drag);

  return (
    // relative はスクリムとバッジの基準。中央ペインも relative だが、そちらは
    // キャンバスの外（下端に積むエラー一覧）の基準なので、覆う範囲がここより広い。
    // これを落とすとスクリムが中央ペインいっぱいに広がるが、テストは 1 件も落ちない。
    <div className="relative flex h-full flex-col">
      <div
        ref={surfaceRef}
        data-testid="canvas-surface"
        {...panHandlers}
        className={`flex-1 overflow-hidden ${
          CanvasView.isDragging(view) ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div
          data-testid="canvas-content"
          /*
           * ファイルが不正な間は選択もドラッグもさせない（映っているのは最後に
           * 正常だった表示なので、そこへ加えた編集は今のファイルと噛み合わない）。
           * 掴んで動かす操作は外側の surface が持つので、`inert` を中身に付けても
           * 見る位置は変えられる。**happy-dom が強制するのはフォーカスまでで、
           * click は届く**（キーボードからの活性化が止まることは
           * `artboard-canvas.frozen.test.tsx` が確かめている）。
           */
          inert={isFrozen}
          style={{
            transform: CanvasView.transform(view),
            transformOrigin: ContentTransformOrigin,
          }}
        >
          <CanvasBody
            compiled={compiled}
            selection={selection}
            tokenSelection={tokenSelection}
            onSelect={onSelect}
            nodeDrag={nodeDrag}
            nodeResize={nodeResize}
            textEdit={textEdit}
          />
        </div>
      </div>
      {isFrozen ? <StaleCanvasOverlay /> : null}
      {/* ハンドルは 1 つだけ選んでいるときに出す（複数選択ではリサイズできない） */}
      {singleName.some ? (
        <ResizeHandleStyle
          name={singleName.value}
          handles={resizeHandles}
          scale={view.scale}
        />
      ) : null}
      {dropTarget.some ? (
        <>
          <DropMarker bounds={dropTarget.value.marker} />
          <DropPositionLabel target={dropTarget.value} />
        </>
      ) : null}
      {textEdit.edit.some ? (
        <TextInlineEditor
          edit={textEdit.edit.value}
          onChange={textEdit.change}
          onCommit={textEdit.commit}
          onCancel={textEdit.cancel}
        />
      ) : null}
    </div>
  );
}

import { type CSSProperties, useMemo, useRef } from "react";
import type { AxisLength } from "@/domains/dcmp/axis-length";
import type { PropEdit } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/session/document-selection";
import type { TokenSelection } from "@/domains/session/token-selection";
import type { Offset } from "@/domains/unit/offset";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import { NodeDrag } from "@/features/canvas/domains/node-drag";
import { NodeResize } from "@/features/canvas/domains/node-resize";
import { useArtboardDrag } from "@/features/canvas/hooks/use-artboard-drag";
import type { CanvasViewControl } from "@/features/canvas/hooks/use-canvas-view";
import { useDrawnBounds } from "@/features/canvas/hooks/use-drawn-bounds";
import type { NodeDragControl } from "@/features/canvas/hooks/use-node-drag";
import { useNodeResize } from "@/features/canvas/hooks/use-node-resize";
import { useTextEdit } from "@/features/canvas/hooks/use-text-edit";
import { DocumentHtml } from "@/services/document-html";
import { Option } from "@/utils/Option";
import { CanvasBody } from "./canvas-body";
import { DropMarker } from "./drop-marker";
import { DropPositionLabel } from "./drop-position-label";
import { RepositionPreviewStyle } from "./reposition-preview-style";
import { ResizeHandleOverlay, resizeCursor } from "./resize-handle-overlay";
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
 * artboard をキャンバス上の座標へ置き、コンパイル結果（実 HTML / CSS）をレンダリングする。
 * ズーム / パンは非永続の view state で、ドキュメントには保存しない。
 *
 * 表示（倍率・位置）を自分で持たず受け取るのは、倍率の操作が上部バーへ移り、
 * キャンバスと上部バーが同じ 1 つの表示を見る必要があるため（#134）。
 *
 * props が 9 つあるが Composition へは割っていない。関心は「キャンバス」1 つで、
 * 前半 3 つは描くのに要る値、後半 6 つは表示とキャンバス上の操作を外へ渡す口。
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
  onRepositionArtboard,
}: Readonly<{
  selection: DocumentSelection;
  tokenSelection: TokenSelection;
  isFrozen: boolean;
  canvasView: CanvasViewControl;
  nodeDrag: NodeDragControl;
  onSelect: (names: readonly string[]) => void;
  onResize: (sizes: readonly AxisLength[]) => void;
  onEditProp: (edit: PropEdit) => void;
  onRepositionArtboard: (name: string, canvasPosition: Offset) => void;
}>) {
  const { view, surfaceRef, panHandlers } = canvasView;
  /*
   * ハンドルを重ねる器。`canvas-surface` の中には置けない（パンのハンドラが
   * どの `pointerdown` でもポインタを捕捉してしまい、ハンドルを押すとパンが始まる）。
   */
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const designDocument = selection.document;
  const nodeResize = useNodeResize({ selection, view, onResize });
  const artboardDrag = useArtboardDrag({
    view,
    onReposition: onRepositionArtboard,
  });
  const textEdit = useTextEdit({ selection, onEditProp });
  /*
   * 凍結中はリサイズハンドルを出さない。`inert` の中にあって掴めないのに、
   * ハンドルだけが普段どおり見えることになるため。選択の枠そのものは残す
   * （何を選んでいたかは右ペインの見出しと揃えて保つ）。
   */
  const resizeHandles = isFrozen ? [] : NodeResize.handles(selection);
  const singleName = DocumentSelection.singleName(selection);
  /*
   * ハンドルは選択中のものの辺へ重ねるので、描かれている位置を実測して追いかける。
   * 選択していない間も呼ぶのは、フックを条件付きで呼べないため（`none` を渡すと
   * 測らずに `none` を返す）。
   */
  const drawnBounds = useDrawnBounds(singleName, canvasAreaRef);
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
  /*
   * ハンドルを置く矩形。掴める軸が無ければ出さないので、そのときは矩形も持たない。
   * 矩形そのものが無いのはまだ描かれていない一瞬で、そこで出すと原点へ 8 個固まる。
   */
  const handleBounds = resizeHandles.length > 0 ? drawnBounds : Option.none;
  /*
   * 掴んでいる間のカーソルは器が出す。ハンドルはそのあいだポインタを通すので、
   * 何も出さないと下にある `cursor-grab`（開いた手）に戻ってしまう。
   */
  const grabbedCursor = Option.map(nodeResize.grabbed, (grabbed) =>
    resizeCursor(grabbed.grip, grabbed.anchor),
  );

  return (
    // relative はスクリムとバッジとリサイズハンドルの基準。中央ペインも relative だが、
    // そちらはキャンバスの外（下端に積むエラー一覧）の基準なので、覆う範囲がここより広い。
    // これを落とすとスクリムが中央ペインいっぱいに広がるが、テストは 1 件も落ちない。
    // overflow-hidden はハンドルを切るため。パンで選択中のものを画面外へ出したときに、
    // 左右のペインの上へハンドルが残らないようにする。
    <div
      ref={canvasAreaRef}
      className="relative flex h-full flex-col overflow-hidden"
    >
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
            cursor: grabbedCursor.some ? grabbedCursor.value : undefined,
          }}
          /*
           * リサイズと artboard の移動のポインタはこの器で受ける。artboard の枠ごとや
           * 座標平面（`ul`）で受けると、枠の外まで引っ張ったときに追従が切れる
           * （リサイズは `onPointerLeave` で取り消すため）。余白を持つのはこの器なので、
           * 外へ引いてもポインタが残る。ツリー内の移動 / 挿入のポインタは
           * 3 ペインの器が受ける（掴む場所が左ペインにもあるため）。
           *
           * 2 つを 1 つのハンドラで束ねるのは、同じ器に別々には載せられないため。
           * 掴んでいないほうは自分の状態を見て何もしないので、両方へ配って問題ない。
           *
           * **ハンドル（`ResizeHandleOverlay`）から掴んだときもここが受ける。**
           * ハンドルは器の外にあるが、掴んでいる間はポインタに対して透明になるので
           * 移動と解放がここまで届く。経路を 1 本にしておかないと、掴み方によって
           * 追従と取り消しの挙動が割れる。
           *
           * 取り消し（`onPointerLeave`）を受けるのはリサイズだけ。artboard の移動は
           * 掴んだ時点でポインタを捕捉するので、この器の外へ出ても届き続ける
           * （`useArtboardDrag` の `grab`）。
           */
          onPointerMove={(event) => {
            nodeResize.dragHandlers.onPointerMove(event);
            artboardDrag.dragHandlers.onPointerMove(event);
          }}
          onPointerUp={() => {
            nodeResize.dragHandlers.onPointerUp();
            artboardDrag.dragHandlers.onPointerUp();
          }}
          onPointerLeave={() => nodeResize.dragHandlers.onPointerLeave()}
        >
          <CanvasBody
            compiled={compiled}
            artboardDrag={artboardDrag}
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
      {/*
        複数選択でハンドルを出さないことは `NodeResize.handles` が既に決めている
        （単一選択でなければ空を返す）ので、ここで数え直してはいない。矩形が無いのは
        まだ描かれていないときで、そのときは置く場所が決まらないので出さない。
      */}
      {handleBounds.some ? (
        <ResizeHandleOverlay
          bounds={handleBounds.value}
          handles={resizeHandles}
          isGrabbing={nodeResize.grabbed.some}
          onGrab={nodeResize.grab}
        />
      ) : null}
      {dropTarget.some ? (
        <>
          <DropMarker bounds={dropTarget.value.marker} />
          <DropPositionLabel target={dropTarget.value} />
        </>
      ) : null}
      {/* 座標を動かすドラッグにはドロップ線が出ないので、代わりに実体を先に動かす */}
      <RepositionPreviewStyle document={designDocument} drag={nodeDrag.drag} />
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

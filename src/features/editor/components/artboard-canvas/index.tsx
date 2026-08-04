import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useMemo,
} from "react";
import type { AxisLength } from "@/domains/axis-length";
import type { ChildPosition } from "@/domains/child-position";
import type { BoxElement } from "@/domains/compiled-element";
import {
  CompiledElement,
  ELEMENT_NAME_ATTRIBUTE,
} from "@/domains/compiled-element";
import type { Axis } from "@/domains/css-direction";
import { Px } from "@/domains/px";
import { CanvasView } from "@/features/editor/domains/canvas-view";
import { EditorState } from "@/features/editor/domains/editor-state";
import { NodeDrag } from "@/features/editor/domains/node-drag";
import type { CanvasBounds } from "@/features/editor/domains/node-drop";
import {
  NodeResize,
  RESIZE_HANDLE_THICKNESS_PX,
} from "@/features/editor/domains/node-resize";
import { useCanvasView } from "@/features/editor/hooks/use-canvas-view";
import {
  type NodeDragControl,
  useNodeDrag,
} from "@/features/editor/hooks/use-node-drag";
import {
  type NodeResizeControl,
  useNodeResize,
} from "@/features/editor/hooks/use-node-resize";
import { type CompiledDocument, DocumentHtml } from "@/services/document-html";
import { ArrayEx } from "@/utils/ArrayEx";
import { Css } from "@/utils/Css";
import { ElementEx } from "@/utils/ElementEx";
import type { Result } from "@/utils/Result";

/** キーボードでも artboard を選べるようにする（role="button" は既定の活性化を持たない）。 */
const ACTIVATION_KEYS = ["Enter", " "];

/**
 * 選択中の要素に描く枠。Tailwind の `outline-blue-500` と同じ色を綴り直している
 * （選択子を組み立てて流し込む規則なので、クラスでは書けない）。
 *
 * 要素の外側に描くのは、雛形の `primary` が同じ青（`#3b82f6`）で、内側に描くと
 * その色を背景に持つ要素（ボタンなど）の上で枠が見えなくなるため。
 * 枠に使えるのは `outline` だけで、`box-shadow` はノードの `shadow` prop が
 * インライン style で使う（docs/03 の対応表）ため奪えない。
 */
const SELECTION_OUTLINE = "outline:2px solid #3b82f6;outline-offset:1px";

/**
 * ドロップ先の Box に描く枠。選択の枠と同時に出るので、色（Tailwind の
 * `emerald-500`）と破線で選択と見分けられるようにする。
 */
const DROP_PARENT_OUTLINE = "outline:2px dashed #10b981;outline-offset:1px";

/**
 * 名前で指した要素だけに効く規則をキャンバスへ差し込む。
 *
 * キャンバスの中身は文字列の HTML を流し込んでおり React の管理下に無いため、
 * 特定の要素へ class を足せない。出力に残っているノード名の属性を選択子にして、
 * 規則を 1 本だけ差し込む。名前はドキュメント全体で一意なので、
 * この 1 本が指すのは狙った artboard / ノードだけになる。
 */
function nameSelector(name: string): string {
  return `[${ELEMENT_NAME_ATTRIBUTE}="${Css.escapeQuotedString(name)}"]`;
}

function NameStyleRule({
  name,
  declarations,
}: Readonly<{ name: string; declarations: string }>) {
  return <style>{`${nameSelector(name)}{${declarations}}`}</style>;
}

/**
 * 軸ごとの、掴める帯の描き方。幅は右辺、高さは下辺に貼り付ける
 * （終端側だけを掴む / `NodeResize.handleAt`）。
 * 2 本を別々の擬似要素へ割り当てるのは、1 要素が持てる擬似要素が 2 つだからで、
 * 3 本目（角）を足すなら描き方から見直すことになる。
 */
const HANDLE_FACES = {
  width: {
    pseudo: "::after",
    edge: "top:0;right:0;height:100%",
    extent: "width",
    cursor: "ew-resize",
  },
  height: {
    pseudo: "::before",
    edge: "left:0;bottom:0;width:100%",
    extent: "height",
    cursor: "ns-resize",
  },
} as const satisfies Readonly<
  Record<
    Axis,
    Readonly<{
      pseudo: string;
      edge: string;
      extent: string;
      cursor: string;
    }>
  >
>;

/** ハンドルの色。選択枠と同じ青（Tailwind の `blue-500`）を、中身が透けるよう薄くして使う。 */
const HANDLE_COLOR = "rgb(59 130 246 / 0.6)";

function handleRule(name: string, handle: AxisLength, scale: number): string {
  const face = HANDLE_FACES[handle.axis];
  /*
   * 太さを倍率で割るのは、掴める帯（当たり判定は client 座標 = 画面上の px）と
   * 見た目の帯を一致させるため。中身は倍率をかけて描かれている。
   */
  const thickness = Px.create(RESIZE_HANDLE_THICKNESS_PX / scale);
  return `${nameSelector(name)}${face.pseudo}{content:"";position:absolute;${face.edge};${face.extent}:${thickness};cursor:${face.cursor};background:${HANDLE_COLOR}}`;
}

/**
 * 選択中の要素に出すリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。
 *
 * 子要素ではなく擬似要素で描くのは、キャンバスの中身が React の管理外にあり
 * ハンドルを差し込む場所が無いため。位置決めを CSS に任せることで、ズーム / パンや
 * リサイズ中の描き直しでハンドルがずれない（実測した座標で置くと測り直しが要る）。
 */
function ResizeHandleStyle({
  name,
  handles,
  scale,
}: Readonly<{
  name: string;
  handles: readonly AxisLength[];
  scale: number;
}>) {
  if (handles.length === 0) {
    return null;
  }
  const faces = handles.map((handle) => handleRule(name, handle, scale));
  // 擬似要素を辺へ貼り付ける基準にするため、選択中の要素自身を位置指定済みにする
  return (
    <style>{`${nameSelector(name)}{position:relative}${faces.join("")}`}</style>
  );
}

/**
 * ドロップ先を示す線（docs/06-ui.md「ドロップ先は『どの Box の何番目の子になるか』を
 * ハイライトで提示する」）。
 *
 * ズーム / パンの変形の**外側**に置き、実測した client 座標をそのまま `position: fixed`
 * で使う。変形の内側に置くと、倍率と平行移動を打ち消す座標変換が要るうえ、
 * 中身は React の管理外なので線を差し込む場所も無い。
 */
function DropMarker({ bounds }: Readonly<{ bounds: CanvasBounds }>) {
  return (
    <div
      data-testid="drop-marker"
      aria-hidden
      className="pointer-events-none fixed z-10 bg-emerald-500"
      style={{
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      }}
    />
  );
}

function CanvasToolbar({
  view,
  onZoomIn,
  onZoomOut,
  onReset,
}: Readonly<{
  view: CanvasView;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}>) {
  return (
    <div className="flex items-center gap-2 border-gray-300 border-b bg-white px-3 py-2 text-sm">
      <button
        type="button"
        onClick={onZoomOut}
        className="rounded border border-gray-300 px-2 hover:bg-gray-100"
      >
        縮小
      </button>
      <p className="w-24 text-center tabular-nums">{`倍率 ${CanvasView.scalePercent(view)}%`}</p>
      <button
        type="button"
        onClick={onZoomIn}
        className="rounded border border-gray-300 px-2 hover:bg-gray-100"
      >
        拡大
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded border border-gray-300 px-2 hover:bg-gray-100"
      >
        等倍に戻す
      </button>
    </div>
  );
}

/**
 * 1 枚の artboard。中身はコンパイル結果の HTML をそのまま流し込む。
 *
 * React 要素へ組み替えないのは、コンパイル結果が `flex-direction` のような
 * kebab-case の CSS プロパティ名を持つのに対し、React の `style` は camelCase の
 * オブジェクトしか受け付けず、プロパティ名の変換表を UI 側へ二重に持つことになるため。
 * 書き出しと同じ文字列を描くことで、キャンバスの見た目と出力の一致も保たれる。
 * 埋め込む文字列のエスケープはコンパイラ側（`Html.escapeText` / `escapeAttribute`）に閉じている。
 */
function ArtboardFrame({
  element,
  isSelected,
  onSelect,
  nodeDrag,
  nodeResize,
}: Readonly<{
  element: BoxElement;
  isSelected: boolean;
  onSelect: (names: readonly string[]) => void;
  nodeDrag: NodeDragControl;
  nodeResize: NodeResizeControl;
}>) {
  /**
   * 押された位置から外へ辿った名前。最後に artboard 自身を置くのは、
   * 中身の外側（枠の上）を押したときにも artboard が選ばれるようにするため
   * （中身を押したときは辿った先に同じ名前が既にあるので、重複を落とす）。
   */
  const namesAt = (target: EventTarget): readonly string[] =>
    ArrayEx.distinct([
      ...ElementEx.attributeValuesToRoot(target, ELEMENT_NAME_ATTRIBUTE),
      element.name,
    ]);

  const activate = (event: KeyboardEvent<HTMLElement>) => {
    if (!ACTIVATION_KEYS.includes(event.key)) {
      return;
    }
    event.preventDefault();
    // キーボードで選べるのは枠にフォーカスしている artboard 自身（中身は指せない）。
    onSelect([element.name]);
  };

  /*
   * `dangerouslySetInnerHTML` に毎回オブジェクトリテラルを渡すと、React は中身が
   * 同じでも別の値とみなして innerHTML を入れ直す。入れ直すと中の要素が作り直され、
   * ポインタを離した時点（ズーム / パンの状態更新）で押していた要素が木から外れて
   * クリックが枠まで上がらなくなる = 中のノードを選べなくなる。
   */
  const innerHtml = useMemo(
    () => ({ __html: CompiledElement.html(element) }),
    [element],
  );

  return (
    <li className="flex flex-col gap-1">
      <span className="text-gray-500 text-xs">{element.name}</span>
      {/* biome-ignore lint/a11y/useSemanticElements: button の中身は phrasing content に限られ、artboard の中身（div の木）を入れられないため role で表す */}
      <div
        role="button"
        tabIndex={0}
        aria-label={element.name}
        aria-current={isSelected}
        onClick={(event: MouseEvent<HTMLElement>) => {
          /*
           * 直前の操作の結果として届く click は選択に使えない（運んだ先 / 掴んだハンドルを
           * 指している）。どちらの操作だったかで扱いは変わらないので両方に尋ねる。
           */
          const afterDrag = nodeDrag.consumeClick();
          const afterResize = nodeResize.consumeClick();
          if (afterDrag || afterResize) {
            return;
          }
          onSelect(namesAt(event.target));
        }}
        onKeyDown={activate}
        onPointerDown={(event) => {
          // artboard の上で始めたドラッグはパンにしない（掴んだものが動かないと操作が読めなくなる）
          event.stopPropagation();
          // ハンドルを掴んだならツリー内の移動ではなく大きさの変更（両方は起こらない）
          if (nodeResize.grabHandle(event)) {
            return;
          }
          nodeDrag.grabHandlers.onPointerDown(event);
        }}
        // 中身のテキストは選択させない（ノードを運ぶドラッグが範囲選択になってしまうため）
        className="w-fit select-none bg-white shadow-sm outline outline-gray-300 aria-[current=true]:outline-2 aria-[current=true]:outline-blue-500"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: コンパイル結果の HTML をそのまま描くのがキャンバスの仕様。埋め込む値のエスケープはコンパイラ側に閉じている（上のコメント参照）
        dangerouslySetInnerHTML={innerHtml}
      />
    </li>
  );
}

/**
 * artboard の並び。`artboards` 配列の順序をそのまま DOM の順序にする。
 * 位置を計算して持たないのは、「キャンバス座標は持たない。ツールが配列順に自動
 * レイアウトする」（docs/01）を、実装側にも座標を作らない形で満たすため。
 *
 * トークンはこの並びのルートへ載せる。artboard の出力は `var()` 参照だけを持つので、
 * トークンの編集は再コンパイルなしにここの差し替えだけで全 artboard へ波及する。
 */
function ArtboardList({
  compiled,
  state,
  onSelect,
  nodeDrag,
  nodeResize,
}: Readonly<{
  compiled: CompiledDocument;
  state: EditorState;
  onSelect: (names: readonly string[]) => void;
  nodeDrag: NodeDragControl;
  nodeResize: NodeResizeControl;
}>) {
  const dropTarget = NodeDrag.dropTarget(nodeDrag.drag);
  /*
   * 動かしている間のポインタは移動とリサイズの両方へ配る。押した時点でどちらか
   * 一方しか始まっておらず（`grabHandle` を先に試す）、始まっていない側は
   * 何も起こさないため、配る順序を気にする必要が無い。
   */
  const dragHandlers = {
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      nodeDrag.dragHandlers.onPointerMove(event);
      nodeResize.dragHandlers.onPointerMove(event);
    },
    onPointerUp: () => {
      nodeDrag.dragHandlers.onPointerUp();
      nodeResize.dragHandlers.onPointerUp();
    },
    onPointerLeave: () => {
      nodeDrag.dragHandlers.onPointerLeave();
      nodeResize.dragHandlers.onPointerLeave();
    },
  };

  return (
    <>
      {state.selectedName.some ? (
        <NameStyleRule
          name={state.selectedName.value}
          declarations={SELECTION_OUTLINE}
        />
      ) : null}
      {dropTarget.some ? (
        <NameStyleRule
          name={dropTarget.value.position.parentName}
          declarations={DROP_PARENT_OUTLINE}
        />
      ) : null}
      {/*
        運んでいる間のポインタは並び全体で受ける。artboard の枠ごとに受けると、
        artboard をまたぐ移動が枠を出た時点で切れてしまう。
      */}
      <ul
        style={compiled.variables}
        className="flex flex-wrap items-start gap-8 p-8"
        {...dragHandlers}
      >
        {compiled.artboards.map((element) => (
          <ArtboardFrame
            key={element.name}
            element={element}
            isSelected={EditorState.isSelected(state, element.name)}
            onSelect={onSelect}
            nodeDrag={nodeDrag}
            nodeResize={nodeResize}
          />
        ))}
      </ul>
    </>
  );
}

/**
 * キャンバスに出す中身。コンパイルの失敗はそのまま表示する
 * （空表示へ倒すと、artboard が無いのかコンパイルが壊れているのか区別できなくなる）。
 */
function CanvasBody({
  compiled,
  state,
  onSelect,
  nodeDrag,
  nodeResize,
}: Readonly<{
  compiled: Result<CompiledDocument, Error>;
  state: EditorState;
  onSelect: (names: readonly string[]) => void;
  nodeDrag: NodeDragControl;
  nodeResize: NodeResizeControl;
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
    <ArtboardList
      compiled={compiled.value}
      state={state}
      onSelect={onSelect}
      nodeDrag={nodeDrag}
      nodeResize={nodeResize}
    />
  );
}

/** 拡大の基準を左上に固定する（中央基準だと倍率を変えるたびに並びの原点が動く）。 */
const CONTENT_TRANSFORM_ORIGIN: CSSProperties["transformOrigin"] = "0 0";

/**
 * キャンバス（docs/06-ui.md「画面構成」）。
 * artboard を配列順に自動配置し、コンパイル結果（実 HTML / CSS）をレンダリングする。
 * ズーム / パンはこのコンポーネントに閉じた非永続の view state で、ドキュメントには保存しない。
 */
export function ArtboardCanvas({
  state,
  onSelect,
  onMoveNode,
  onResize,
}: Readonly<{
  state: EditorState;
  onSelect: (names: readonly string[]) => void;
  onMoveNode: (name: string, to: ChildPosition) => void;
  onResize: (size: AxisLength) => void;
}>) {
  const { view, surfaceRef, panHandlers, zoomIn, zoomOut, reset } =
    useCanvasView();
  const nodeDrag = useNodeDrag({
    document: state.document,
    onMove: onMoveNode,
  });
  const nodeResize = useNodeResize({ state, view, onResize });
  const resizeHandles = NodeResize.handles(state);
  const compiled = useMemo(
    () => DocumentHtml.compile(state.document),
    [state.document],
  );
  const dropTarget = NodeDrag.dropTarget(nodeDrag.drag);

  return (
    <div className="flex h-full flex-col">
      <CanvasToolbar
        view={view}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={reset}
      />
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
          style={{
            transform: CanvasView.transform(view),
            transformOrigin: CONTENT_TRANSFORM_ORIGIN,
          }}
        >
          <CanvasBody
            compiled={compiled}
            state={state}
            onSelect={onSelect}
            nodeDrag={nodeDrag}
            nodeResize={nodeResize}
          />
        </div>
      </div>
      {state.selectedName.some ? (
        <ResizeHandleStyle
          name={state.selectedName.value}
          handles={resizeHandles}
          scale={view.scale}
        />
      ) : null}
      {dropTarget.some ? <DropMarker bounds={dropTarget.value.marker} /> : null}
    </div>
  );
}

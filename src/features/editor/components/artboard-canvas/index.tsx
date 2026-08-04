import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  useMemo,
} from "react";
import type { BoxElement } from "@/domains/compiled-element";
import {
  CompiledElement,
  ELEMENT_NAME_ATTRIBUTE,
} from "@/domains/compiled-element";
import { CanvasView } from "@/features/editor/domains/canvas-view";
import { EditorState } from "@/features/editor/domains/editor-state";
import { useCanvasView } from "@/features/editor/hooks/use-canvas-view";
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
 * 選択中の要素をキャンバス上で示す規則（docs/06-ui.md「選択」）。
 *
 * キャンバスの中身は文字列の HTML を流し込んでおり React の管理下に無いため、
 * 選択中の要素へ class を足せない。出力に残っているノード名の属性を選択子にして、
 * 規則を 1 本だけ差し込む。名前はドキュメント全体で一意なので、
 * この 1 本が指すのは選択中の artboard / ノードだけになる。
 */
function SelectionHighlight({ name }: Readonly<{ name: string }>) {
  return (
    <style>{`[${ELEMENT_NAME_ATTRIBUTE}="${Css.escapeQuotedString(name)}"]{${SELECTION_OUTLINE}}`}</style>
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
}: Readonly<{
  element: BoxElement;
  isSelected: boolean;
  onSelect: (names: readonly string[]) => void;
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
        onClick={(event: MouseEvent<HTMLElement>) =>
          onSelect(namesAt(event.target))
        }
        onKeyDown={activate}
        // artboard の上で始めたドラッグはパンにしない（掴んだものが動かないと操作が読めなくなる）
        onPointerDown={(event) => event.stopPropagation()}
        className="w-fit bg-white shadow-sm outline outline-gray-300 aria-[current=true]:outline-2 aria-[current=true]:outline-blue-500"
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
}: Readonly<{
  compiled: CompiledDocument;
  state: EditorState;
  onSelect: (names: readonly string[]) => void;
}>) {
  return (
    <>
      {state.selectedName.some ? (
        <SelectionHighlight name={state.selectedName.value} />
      ) : null}
      <ul
        style={compiled.variables}
        className="flex flex-wrap items-start gap-8 p-8"
      >
        {compiled.artboards.map((element) => (
          <ArtboardFrame
            key={element.name}
            element={element}
            isSelected={EditorState.isSelected(state, element.name)}
            onSelect={onSelect}
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
}: Readonly<{
  compiled: Result<CompiledDocument, Error>;
  state: EditorState;
  onSelect: (names: readonly string[]) => void;
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
    <ArtboardList compiled={compiled.value} state={state} onSelect={onSelect} />
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
}: Readonly<{
  state: EditorState;
  onSelect: (names: readonly string[]) => void;
}>) {
  const { view, surfaceRef, panHandlers, zoomIn, zoomOut, reset } =
    useCanvasView();
  const compiled = useMemo(
    () => DocumentHtml.compile(state.document),
    [state.document],
  );

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
          <CanvasBody compiled={compiled} state={state} onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}

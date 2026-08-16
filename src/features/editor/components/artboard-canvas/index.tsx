import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  useMemo,
} from "react";
import type { AxisLength } from "@/domains/axis-length";
import type { CompiledArtboard } from "@/domains/compiled-artboard";
import {
  CompiledElement,
  ElementNameAttribute,
} from "@/domains/compiled-element";
import type { Axis } from "@/domains/css-direction";
import type { PropEdit } from "@/domains/node";
import { Px } from "@/domains/px";
import { CanvasView } from "@/features/editor/domains/canvas-view";
import { EditorState } from "@/features/editor/domains/editor-state";
import { NodeDrag } from "@/features/editor/domains/node-drag";
import type {
  CanvasBounds,
  DropTarget,
} from "@/features/editor/domains/node-drop";
import {
  NodeResize,
  ResizeHandleThicknessPx,
} from "@/features/editor/domains/node-resize";
import type { TextEdit } from "@/features/editor/domains/text-edit";
import type { CanvasViewControl } from "@/features/editor/hooks/use-canvas-view";
import type { NodeDragControl } from "@/features/editor/hooks/use-node-drag";
import {
  type NodeResizeControl,
  useNodeResize,
} from "@/features/editor/hooks/use-node-resize";
import {
  type TextEditControl,
  useTextEdit,
} from "@/features/editor/hooks/use-text-edit";
import { type CompiledDocument, DocumentHtml } from "@/services/document-html";
import { ArrayEx } from "@/utils/ArrayEx";
import { Css } from "@/utils/Css";
import { ElementEx } from "@/utils/ElementEx";
import type { Result } from "@/utils/Result";

/** キーボードでも artboard を選べるようにする（role="button" は既定の活性化を持たない）。 */
const ActivationKeys = ["Enter", " "];

/**
 * 選択中の要素に描く枠。Tailwind の `outline-blue-500` と同じ色を綴り直している
 * （選択子を組み立てて流し込む規則なので、クラスでは書けない）。
 *
 * 要素の外側に描くのは、雛形の `primary` が同じ青（`#3b82f6`）で、内側に描くと
 * その色を背景に持つ要素（ボタンなど）の上で枠が見えなくなるため。
 * 枠に使えるのは `outline` だけで、`box-shadow` はノードの `shadow` prop が
 * インライン style で使う（docs/03 の対応表）ため奪えない。
 */
const SelectionOutline = "outline:2px solid #3b82f6;outline-offset:1px";

/**
 * ドロップ先の Box に描く枠。選択の枠と同時に出るので、色（Tailwind の
 * `emerald-500`）と破線で選択と見分けられるようにする。
 */
const DropParentOutline = "outline:2px dashed #10b981;outline-offset:1px";

/**
 * 選択中のトークンを参照しているノードに描く枠
 * （UI 案 docs/Design Composer.html の Tokens 画面）。
 *
 * UI 案は要素ごとに `outline-offset` を 2px と 3px で使い分けているが、名前で引く規則は
 * 1 本しか差し込めないので 2px に寄せた。
 *
 * export しているのは、どの規則が破線かをテストが綴りを写さずに引けるようにするため
 * （`features/editor/__tests__/canvas-elements`）。写すと色を変えただけでテストが落ちる。
 */
export const TokenReferrerOutline =
  "outline:1.5px dashed #0d99ff;outline-offset:2px";

/**
 * 名前で指した要素だけに効く規則をキャンバスへ差し込む。
 *
 * キャンバスの中身は文字列の HTML を流し込んでおり React の管理下に無いため、
 * 特定の要素へ class を足せない。出力に残っているノード名の属性を選択子にして、
 * 規則を 1 本だけ差し込む。名前はドキュメント全体で一意なので、
 * この 1 本が指すのは狙った artboard / ノードだけになる。
 *
 * @param name 指したい artboard / ノードの名前
 * @returns その名前の属性に当たる属性選択子
 */
function nameSelector(name: string): string {
  return `[${ElementNameAttribute}="${Css.escapeQuotedString(name)}"]`;
}

/** 1 ノード分の宣言を、名前で引く選択子の規則としてキャンバスへ差し込む。 */
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
const HandleFaces = {
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
const HandleColor = "rgb(59 130 246 / 0.6)";

/**
 * リサイズハンドル 1 本を描く規則。掴める帯と見た目の帯を倍率にかかわらず一致させる。
 *
 * @param name ハンドルを出す artboard / ノードの名前
 * @param handle どの軸のハンドルか
 * @param scale 今のキャンバスの倍率（帯の太さを割り戻すのに使う）
 * @returns その辺に帯を描く CSS 規則 1 本
 */
function handleRule(name: string, handle: AxisLength, scale: number): string {
  const face = HandleFaces[handle.axis];
  /*
   * 太さを倍率で割るのは、掴める帯（当たり判定は client 座標 = 画面上の px）と
   * 見た目の帯を一致させるため。中身は倍率をかけて描かれている。
   */
  const thickness = Px.create(ResizeHandleThicknessPx / scale);
  return `${nameSelector(name)}${face.pseudo}{content:"";position:absolute;${face.edge};${face.extent}:${thickness};cursor:${face.cursor};background:${HandleColor}}`;
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

/** 編集を終えるキー（docs/06-ui.md「確定（Enter / フォーカス外し）」「キャンセル（Escape）」）。 */
const CommitKey = "Enter";
const CancelKey = "Escape";

/**
 * 編集中の Text に重ねる入力欄（docs/06-ui.md「Text のインライン編集」）。
 *
 * 描かれた要素そのものを編集させられない（キャンバスの中身は React の管理外にあり、
 * ドキュメントが変わるたびに innerHTML ごと入れ替わるためキャレットが飛ぶ）ので、
 * 実測した矩形の上へ重ねる。ズーム / パンの変形の**外側**へ置き、実測した client 座標を
 * そのまま `position: fixed` で使うのは `DropMarker` と同じ理由。
 */
function TextInlineEditor({
  edit,
  onChange,
  onCommit,
  onCancel,
}: Readonly<{
  edit: TextEdit;
  onChange: (draft: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}>) {
  return (
    <input
      type="text"
      // biome-ignore lint/a11y/noAutofocus: ダブルクリックで開く一時的な入力欄であり、開いた先で打てないと「その場で編集する」操作にならない
      autoFocus
      aria-label="文言を編集"
      value={edit.draft}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onCommit}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === CommitKey) {
          onCommit();
        }
        if (event.key === CancelKey) {
          onCancel();
        }
      }}
      /*
       * 最小の幅と高さを与えるのは、文言が空の Text は矩形が潰れており、
       * 実測どおりに重ねると掴めない入力欄になるため。
       */
      className="fixed z-10 min-h-6 min-w-24 border-2 border-blue-500 bg-white px-1 text-sm"
      style={{
        left: `${edit.bounds.left}px`,
        top: `${edit.bounds.top}px`,
        width: `${edit.bounds.width}px`,
        height: `${edit.bounds.height}px`,
      }}
    />
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

/**
 * ドロップ先を「どの親の何個中どこか」として読ませるラベル
 * （UI 案 docs/Design Composer.html の `into login-form · child 3 of 5`）。
 *
 * 数え方は UI 案の図に合わせた。`login-form` は子を 5 つ持ち、線はその 4 つ目の手前に
 * あるので、`N` は挿入位置（0 起点）、`M` は落とす前の子の数になる。先頭へ落とすと
 * `child 0 of 5` になり日本語としては硬いが、綴りを読みやすくすると UI 案の数字を
 * 再現できなくなる。
 *
 * 色は今のドロップ提示（緑の破線）に合わせる。UI 案はここも選択と同じ青にしているが、
 * 選択と見分けるために緑にしてあるので、まとめて青へ寄せるのは #112 の担当。
 *
 * `DropMarker` と同じくズーム / パンの変形の**外側**へ置き、実測した client 座標を
 * `position: fixed` で使う。
 */
function DropPositionLabel({ target }: Readonly<{ target: DropTarget }>) {
  return (
    <p
      aria-hidden
      className="pointer-events-none fixed z-10 whitespace-nowrap rounded-t-[3px] bg-emerald-500 px-1.5 py-0.5 font-medium text-[10px] text-white"
      style={{
        left: `${target.parentBounds.left}px`,
        // ラベルの高さぶん親の上へ持ち上げ、枠に載せる（UI 案と同じ置き方）
        top: `${target.parentBounds.top - 18}px`,
      }}
    >
      into {target.position.parentName} · child {target.position.index} of{" "}
      {target.childCount}
    </p>
  );
}

/**
 * artboard の見出し（UI 案 docs/Design Composer.html。名前の右に大きさが並ぶ）。
 *
 * 名前が青く太くなるのは「今ツリーが映している 1 枚」のとき（#184）。UI 案で色が
 * 付いているのは 10 行中 1 行だけで、その画面では artboard 自身ではなく配下のノードが
 * 選択されている。一方その画面は `Artboards` 一覧が `login` をハイライトしている
 * 唯一の画面でもあるので、青が指しているのは選択ではなく「今見ている 1 枚」と読んだ。
 * Why not: `EditorState.isSelected` は採らない。UI 案の唯一の色付きを再現できない。
 *
 * Why not: 大きさの綴りを `artboard-list` と共通化しない。UI 案はツリー側が
 * `720×900`、キャンバス側が `720 × 900` で空白の有無が違う。
 *
 * @returns 名前と大きさを並べた見出しの 1 行
 */
function ArtboardLabel({
  artboard,
  isCurrent,
}: Readonly<{ artboard: CompiledArtboard; isCurrent: boolean }>) {
  return (
    <span className="flex h-[18px] items-center gap-2 text-[11px]">
      {/*
        **この出し分けを潰してもテストは 1 件も落ちない。** happy-dom は Tailwind を
        解決せず、class 名を assert するのは実装詳細のテストになる。気づく手段は
        `ArtboardCanvas` の視覚差分（選択なし / artboard を選択中）だけ。
      */}
      <span
        className={isCurrent ? "font-medium text-[#0d99ff]" : "text-[#8c8c8c]"}
      >
        {artboard.element.name}
      </span>
      {/* 選択中の artboard でも大きさは太くしない（UI 案が font-weight を明示している） */}
      <span className="font-normal text-[#b3b3b3]">
        {artboard.width} × {artboard.height}
      </span>
    </span>
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
  artboard,
  isSelected,
  isCurrent,
  onSelect,
  nodeDrag,
  nodeResize,
  textEdit,
}: Readonly<{
  artboard: CompiledArtboard;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: (names: readonly string[]) => void;
  nodeDrag: NodeDragControl;
  nodeResize: NodeResizeControl;
  textEdit: TextEditControl;
}>) {
  /**
   * 押された位置から外へ辿った名前。最後に artboard 自身を置くのは、
   * 中身の外側（枠の上）を押したときにも artboard が選ばれるようにするため
   * （中身を押したときは辿った先に同じ名前が既にあるので、重複を落とす）。
   */
  const element = artboard.element;
  const namesAt = (target: EventTarget): readonly string[] =>
    ArrayEx.distinct([
      ...ElementEx.attributeValuesToRoot(target, ElementNameAttribute),
      element.name,
    ]);

  const activate = (event: KeyboardEvent<HTMLElement>) => {
    if (!ActivationKeys.includes(event.key)) {
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
      <ArtboardLabel artboard={artboard} isCurrent={isCurrent} />
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
        /*
         * ダブルクリックは押された Text の文言のその場編集（docs/06-ui.md）。
         * 直前の click 2 回で対象は選択済みなので、始められるかは
         * 押された位置と選択で決まる（`EditableText.at`）。
         */
        onDoubleClick={(event: MouseEvent<HTMLElement>) =>
          textEdit.start(namesAt(event.target))
        }
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
  textEdit,
}: Readonly<{
  compiled: CompiledDocument;
  state: EditorState;
  onSelect: (names: readonly string[]) => void;
  nodeDrag: NodeDragControl;
  nodeResize: NodeResizeControl;
  textEdit: TextEditControl;
}>) {
  const dropTarget = NodeDrag.dropTarget(nodeDrag.drag);

  /*
   * ドキュメント全体を走査するので、パン / ズームのたびに数え直さない
   * （`compiled` を覚えているのと同じ理由）。
   */
  const tokenReferrerNames = useMemo(
    () => EditorState.tokenReferrerNodeNames(state),
    [state],
  );

  return (
    <>
      {/*
        選択の枠より**前**に置く。同じ選択子・同じ詳細度なので後に書いたほうが勝ち、
        選択中のノードがそのトークンを参照していると選択の枠が消えてしまう。
      */}
      {tokenReferrerNames.map((name) => (
        <NameStyleRule
          key={name}
          name={name}
          declarations={TokenReferrerOutline}
        />
      ))}
      {/* 複数選んでいるときは選んだぶんだけ枠を出す（ツリーと違い artboard をまたげる） */}
      {EditorState.selectedNames(state).map((name) => (
        <NameStyleRule key={name} name={name} declarations={SelectionOutline} />
      ))}
      {dropTarget.some ? (
        <NameStyleRule
          name={dropTarget.value.position.parentName}
          declarations={DropParentOutline}
        />
      ) : null}
      {/*
        リサイズ中のポインタは並び全体で受ける。artboard の枠ごとに受けると、
        枠の外まで引っ張ったときに追従が切れてしまう。ツリー内の移動 / 挿入の
        ポインタは 3 ペインの器が受ける（掴む場所が左ペインにもあるため）。
      */}
      <ul
        style={compiled.variables}
        className="flex flex-wrap items-start gap-8 p-8"
        {...nodeResize.dragHandlers}
      >
        {compiled.artboards.map((artboard) => (
          <ArtboardFrame
            key={artboard.element.name}
            artboard={artboard}
            isSelected={EditorState.isSelected(state, artboard.element.name)}
            isCurrent={EditorState.isCurrentArtboard(
              state,
              artboard.element.name,
            )}
            onSelect={onSelect}
            nodeDrag={nodeDrag}
            nodeResize={nodeResize}
            textEdit={textEdit}
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
  textEdit,
}: Readonly<{
  compiled: Result<CompiledDocument, Error>;
  state: EditorState;
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
    <ArtboardList
      compiled={compiled.value}
      state={state}
      onSelect={onSelect}
      nodeDrag={nodeDrag}
      nodeResize={nodeResize}
      textEdit={textEdit}
    />
  );
}

/** 拡大の基準を左上に固定する（中央基準だと倍率を変えるたびに並びの原点が動く）。 */
const ContentTransformOrigin: CSSProperties["transformOrigin"] = "0 0";

/**
 * 斜線のスクリム（UI 案 docs/Design Composer.html の Error 画面の実測値は
 * `repeating-linear-gradient(-45deg, transparent 0 22px, rgba(209,52,56,0.055) 22px 24px)`）。
 *
 * この斜線を落としてもバッジは残り、テストは 1 件も落ちない。
 * 気づく手段は Storybook の視覚差分だけ。
 */
const StaleScrimClass =
  "bg-[repeating-linear-gradient(-45deg,transparent_0_22px,rgba(209,52,56,0.055)_22px_24px)]";

/**
 * ファイルが不正な間、キャンバスへ重ねるもの（#135）。斜線のスクリムと、
 * 映っているのが最後に正常だった表示であることを名乗るバッジ。
 *
 * スクリムが `pointer-events-none` なのは、下のキャンバスを掴んで動かせるようにするため
 * （凍らせるのは編集で、どこを見るかは変えられてよい）。
 *
 * @returns キャンバス全面の斜線と、右上のバッジ
 */
function StaleCanvasOverlay(): ReactElement {
  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${StaleScrimClass}`}
      />
      {/* 掴んで動かす操作を食わないよう、バッジもポインタを素通しする */}
      <p className="pointer-events-none absolute top-3.5 right-3.5 rounded-[5px] border border-red-200 bg-white px-2 py-1 font-semibold text-[10px] text-red-600">
        最後に正常だった表示
      </p>
    </>
  );
}

/**
 * キャンバス（docs/06-ui.md「画面構成」）。
 * artboard を配列順に自動配置し、コンパイル結果（実 HTML / CSS）をレンダリングする。
 * ズーム / パンは非永続の view state で、ドキュメントには保存しない。
 *
 * 表示（倍率・位置）を自分で持たず受け取るのは、倍率の操作が上部バーへ移り、
 * キャンバスと上部バーが同じ 1 つの表示を見る必要があるため（#134）。
 *
 * props が 5 つあるが Composition へは割っていない。関心は「キャンバス」1 つで、
 * ハンドラはいずれもキャンバス上の操作を外へ渡すもの。`NodeActions` を丸ごと
 * 受けると、使わない `createComponent` / `insertAt` などまで渡ることになる。
 *
 * ツリー内の移動 / 挿入のドラッグを自分で持たず受け取るのは、掴む場所がキャンバスだけで
 * なくなったため。パレット（左ペイン）からも掴めるので、状態は両方の親が持つ
 * （`opened-document-editor`）。
 */
export function ArtboardCanvas({
  state,
  canvasView,
  nodeDrag,
  onSelect,
  onResize,
  onEditProp,
}: Readonly<{
  state: EditorState;
  canvasView: CanvasViewControl;
  nodeDrag: NodeDragControl;
  onSelect: (names: readonly string[]) => void;
  onResize: (size: AxisLength) => void;
  onEditProp: (edit: PropEdit) => void;
}>) {
  const { view, surfaceRef, panHandlers } = canvasView;
  const designDocument = EditorState.document(state);
  const nodeResize = useNodeResize({ state, view, onResize });
  const textEdit = useTextEdit({ state, onEditProp });
  const isFrozen = EditorState.isFileInvalid(state);
  /*
   * 凍結中はリサイズハンドルを出さない。`inert` の中にあって掴めないのに、
   * 掴める帯だけが普段どおり見えることになるため。選択の枠そのものは残す
   * （何を選んでいたかは右ペインの見出しと揃えて保つ）。
   */
  const resizeHandles = isFrozen ? [] : NodeResize.handles(state);
  const singleName = EditorState.singleName(state);
  const compiled = useMemo(
    () => DocumentHtml.compile(designDocument),
    [designDocument],
  );
  const dropTarget = NodeDrag.dropTarget(nodeDrag.drag);

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
            state={state}
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

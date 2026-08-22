import { useMemo } from "react";
import { TokenSelection } from "@/domains/token-selection";
import { EditorState } from "@/features/editor/domains/editor-state";
import { NodeDrag } from "@/features/editor/domains/node-drag";
import type { NodeDragControl } from "@/features/editor/hooks/use-node-drag";
import type { NodeResizeControl } from "@/features/editor/hooks/use-node-resize";
import type { TextEditControl } from "@/features/editor/hooks/use-text-edit";
import type { CompiledDocument } from "@/services/document-html";
import { ArtboardFrame } from "../artboard-frame";
import { NameStyleRule } from "../name-style-rule";

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
 * （`features/editor/__tests__/canvas-elements`。`artboard-canvas` が再 export する）。
 * 写すと色を変えただけでテストが落ちる。
 */
export const TokenReferrerOutline =
  "outline:1.5px dashed #0d99ff;outline-offset:2px";

/**
 * artboard の並び。`artboards` 配列の順序をそのまま DOM の順序にする。
 * 位置を計算して持たないのは、「キャンバス座標は持たない。ツールが配列順に自動
 * レイアウトする」（docs/01）を、実装側にも座標を作らない形で満たすため。
 *
 * トークンはこの並びのルートへ載せる。artboard の出力は `var()` 参照だけを持つので、
 * トークンの編集は再コンパイルなしにここの差し替えだけで全 artboard へ波及する。
 *
 * 名前が `ArtboardList` でないのは、左ペインの一覧（`features/sidebar` の `artboard-list`）と
 * 綴りがぶつかるため。並べているのは枠（`ArtboardFrame`）なのでそちらを名前に出す。
 */
export function ArtboardFrameList({
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
    () =>
      TokenSelection.collectCanvasReferrerNames(
        EditorState.tokenSelection(state),
      ),
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

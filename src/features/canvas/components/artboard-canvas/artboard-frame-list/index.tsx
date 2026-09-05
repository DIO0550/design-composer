import { useMemo } from "react";
import { DocumentSelection } from "@/domains/session/document-selection";
import { TokenSelection } from "@/domains/session/token-selection";
import { ArrangedArtboard } from "@/features/canvas/domains/arranged-artboard";
import { NodeDrag } from "@/features/canvas/domains/node-drag";
import type { ArtboardDragControl } from "@/features/canvas/hooks/use-artboard-drag";
import type { NodeDragControl } from "@/features/canvas/hooks/use-node-drag";
import type { NodeResizeControl } from "@/features/canvas/hooks/use-node-resize";
import type { TextEditControl } from "@/features/canvas/hooks/use-text-edit";
import type { CompiledDocument } from "@/services/document-html";
import { ArtboardFrame } from "../artboard-frame";
import { NameStyleRule } from "../name-style-rule";

/**
 * 選択を表す青。Tailwind の `outline-blue-500` と同じ色を綴り直している
 * （選択子を組み立てて流し込む規則なので、クラスでは書けない）。
 *
 * export しているのは、枠とリサイズハンドル（`resize-handle-overlay`）が同じ色でなければ
 * ならないため。別々に綴ると片方だけ変わって、同じ選択表示に青が 2 色出る。
 */
export const SelectionColor = "#3b82f6";

/**
 * 選択中の要素に描く枠。
 *
 * 要素の外側に描くのは、雛形の `primary` が同じ青（`#3b82f6`）で、内側に描くと
 * その色を背景に持つ要素（ボタンなど）の上で枠が見えなくなるため。
 * 枠に使えるのは `outline` だけで、`box-shadow` はノードの `shadow` prop が
 * インライン style で使う（docs/03 の対応表）ため奪えない。
 */
const SelectionOutline = `outline:2px solid ${SelectionColor};outline-offset:1px`;

/**
 * ドロップ先の Box に描く枠。選択の枠と同時に出るので、色（Tailwind の
 * `emerald-500`）と破線で選択と見分けられるようにする。
 *
 * ツリーへ落とすときと座標を置き直すときの両方に出す。座標のドラッグでも
 * 親は付け替わる（#388）ので、どこへ入るかを見せないと目隠しで運ぶことになる。
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
 * （`features/canvas/__tests__/canvas-elements`。`artboard-canvas` が再 export する）。
 * 写すと色を変えただけでテストが落ちる。
 */
export const TokenReferrerOutline =
  "outline:1.5px dashed #0d99ff;outline-offset:2px";

/**
 * artboard の並び。`artboards` 配列の順序をそのまま DOM の順序にする。
 * 置き場所はキャンバス上の座標で、ファイルに座標を持たない artboard だけを
 * 配列順に横へ並べる（`ArrangedArtboard`）。
 *
 * トークンはこの並びのルートへ載せる。artboard の出力は `var()` 参照だけを持つので、
 * トークンの編集は再コンパイルなしにここの差し替えだけで全 artboard へ波及する。
 *
 * 名前が `ArtboardList` でないのは、左ペインの一覧（`features/sidebar` の `artboard-list`）と
 * 綴りがぶつかるため。並べているのは枠（`ArtboardFrame`）なのでそちらを名前に出す。
 */
export function ArtboardFrameList({
  compiled,
  selection,
  tokenSelection,
  onSelect,
  artboardDrag,
  nodeDrag,
  nodeResize,
  textEdit,
}: Readonly<{
  compiled: CompiledDocument;
  selection: DocumentSelection;
  tokenSelection: TokenSelection;
  onSelect: (names: readonly string[]) => void;
  artboardDrag: ArtboardDragControl;
  nodeDrag: NodeDragControl;
  nodeResize: NodeResizeControl;
  textEdit: TextEditControl;
}>) {
  const dropParentName = NodeDrag.dropParentName(nodeDrag.drag);
  const arranged = ArrangedArtboard.fromArtboards(compiled.artboards);
  const size = ArrangedArtboard.size(arranged);

  /*
   * ドキュメント全体を走査するので、パン / ズームのたびに数え直さない
   * （`compiled` を覚えているのと同じ理由）。覚えられるのは、呼び出し側が
   * トークンの対を 1 つだけ作って渡している間だけ（`EditorPanes`）。
   */
  const tokenReferrerNames = useMemo(
    () => TokenSelection.collectCanvasReferrerNames(tokenSelection),
    [tokenSelection],
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
      {DocumentSelection.names(selection).map((name) => (
        <NameStyleRule key={name} name={name} declarations={SelectionOutline} />
      ))}
      {dropParentName.some ? (
        <NameStyleRule
          name={dropParentName.value}
          declarations={DropParentOutline}
        />
      ) : null}
      {/*
        余白は座標平面の**外側**に置く。artboard の見出しは枠の上へ出るので、原点に
        ある artboard の見出しがそのままでは上へはみ出す。座標側の起点をずらして
        避けると、ファイルに書いた `y` と見た目が食い違う。`ul` 自身の padding では
        効かない（絶対配置の子は padding box の辺を基準にするため）。
      */}
      <div className="p-8">
        {/*
          座標平面そのもの。子を絶対配置にすると内容の大きさを失うので、並び全体の
          大きさを与える。これが**リサイズ中のポインタを受ける範囲**（受け口は
          `ArtboardCanvas` の `canvas-content`）の高さを決めるので、0 のままだと
          辺を外へ引いたときに追従が切れる。

          この余白・`relative`・子の `absolute` は座標配置そのもの。**潰してもテストは
          1 件も落ちない**（happy-dom はレイアウトしないため）。気づく手段は視覚差分だけ。
        */}
        <ul style={{ ...compiled.variables, ...size }} className="relative">
          {arranged.map((placed) => (
            <ArtboardFrame
              key={placed.artboard.element.name}
              arranged={placed}
              isSelected={DocumentSelection.isSelected(
                selection,
                placed.artboard.element.name,
              )}
              isCurrent={DocumentSelection.isCurrentArtboard(
                selection,
                placed.artboard.element.name,
              )}
              onSelect={onSelect}
              artboardDrag={artboardDrag}
              nodeDrag={nodeDrag}
              nodeResize={nodeResize}
              textEdit={textEdit}
            />
          ))}
        </ul>
      </div>
    </>
  );
}

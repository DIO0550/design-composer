import { type KeyboardEvent, type MouseEvent, useMemo } from "react";
import {
  CompiledElement,
  ElementNameAttribute,
} from "@/domains/compiled/compiled-element";
import type { ArrangedArtboard } from "@/features/canvas/domains/arranged-artboard";
import type { ArtboardDragControl } from "@/features/canvas/hooks/use-artboard-drag";
import type { NodeDragControl } from "@/features/canvas/hooks/use-node-drag";
import type { NodeResizeControl } from "@/features/canvas/hooks/use-node-resize";
import type { TextEditControl } from "@/features/canvas/hooks/use-text-edit";
import { ArrayEx } from "@/utils/ArrayEx";
import { ElementEx } from "@/utils/ElementEx";
import { ArtboardLabel } from "../artboard-label";

/** キーボードでも artboard を選べるようにする（role="button" は既定の活性化を持たない）。 */
const ActivationKeys = ["Enter", " "];

/**
 * 1 枚の artboard。中身はコンパイル結果の HTML をそのまま流し込む。
 *
 * React 要素へ組み替えないのは、コンパイル結果が `flex-direction` のような
 * kebab-case の CSS プロパティ名を持つのに対し、React の `style` は camelCase の
 * オブジェクトしか受け付けず、プロパティ名の変換表を UI 側へ二重に持つことになるため。
 * 書き出しと同じ文字列を描くことで、キャンバスの見た目と出力の一致も保たれる。
 * 埋め込む文字列のエスケープはコンパイラ側（`Html.escapeText` / `escapeAttribute`）に閉じている。
 */
export function ArtboardFrame({
  arranged,
  isSelected,
  isCurrent,
  onSelect,
  artboardDrag,
  nodeDrag,
  nodeResize,
  textEdit,
}: Readonly<{
  arranged: ArrangedArtboard;
  isSelected: boolean;
  isCurrent: boolean;
  onSelect: (names: readonly string[]) => void;
  artboardDrag: ArtboardDragControl;
  nodeDrag: NodeDragControl;
  nodeResize: NodeResizeControl;
  textEdit: TextEditControl;
}>) {
  const { artboard, canvasPosition } = arranged;
  /*
   * 運んでいる間は確定前の位置で描く。ドキュメントを書き換えるのは離したときだけなので、
   * ここで見せないと離すまで画面に何も起きない（`useArtboardDrag` の doc）。
   */
  const preview = artboardDrag.preview;
  const isDragged =
    preview.some && preview.value.name === artboard.element.name;
  const drawnAt = isDragged ? preview.value.canvasPosition : canvasPosition;
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
    /*
     * 座標が指すのは**枠の左上**なので、ラベルは枠の上へ絶対配置してレイアウトを
     * 食わせない。縦に積むと、ドキュメントに無いラベルの高さぶん枠が下がり、
     * 保存した座標とキャンバス上の位置がずれる。
     *
     * この 2 つの `absolute` を潰すと枠は縦に積まれ、座標が効かなくなるが、
     * **テストは 1 件も落ちない**（happy-dom はレイアウトしないため）。
     * 気づく手段は視覚差分だけ。
     */
    <li className="absolute" style={{ left: drawnAt.x, top: drawnAt.y }}>
      {/*
        `right-0` で枠の幅いっぱいに広げるのは、見出しが掴み口だから（`ArtboardLabel`）。
        中身ぶんだと `home 360 × 240` で 85px しか無く、枠の 360px に対して狙いづらい。
        UI 案（docs/Design Composer.html）の見出しも枠と同じ幅のブロックなので、
        絞るほうが乖離だった。

        **この幅はテストにも視覚差分にも出ない。** happy-dom はレイアウトしないので
        測れず、見出しは左寄せで背景も枠線も持たないため絞っても絵が変わらない
        （実測: `w-fit` を戻しても 2639 件すべて緑）。掴める範囲が 85px へ戻っても
        気づく手段が無い。
      */}
      <div className="absolute right-0 bottom-full left-0 pb-1">
        <ArtboardLabel
          artboard={artboard}
          isCurrent={isCurrent}
          onGrab={(event) =>
            artboardDrag.grab(element.name, canvasPosition, event)
          }
        />
      </div>
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
           *
           * artboard のドラッグは尋ねない。運んだあとの click はどちらの掴み口からも
           * ここへ届かず、届いてもその artboard を選ぶだけで害が無い
           * （`ArtboardDrag` の doc）。
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
          /*
           * 内側から外へ向かって掴み手を決める。ハンドル → 中身のノード → artboard 自身の順で、
           * 先に掴んだものが後ろへ渡さない。artboard を末尾に置くのは、背景（子が乗っていない
           * ところ）まで来たら必ず掴めるため（`ArtboardDrag.grab` は失敗しない）。
           */
          if (nodeResize.grabHandle(event)) {
            return;
          }
          if (nodeDrag.grabNode(event)) {
            return;
          }
          artboardDrag.grab(element.name, canvasPosition, event);
        }}
        // 中身のテキストは選択させない（ノードを運ぶドラッグが範囲選択になってしまうため）
        className="w-fit select-none bg-white shadow-sm outline outline-gray-300 aria-[current=true]:outline-2 aria-[current=true]:outline-blue-500"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: コンパイル結果の HTML をそのまま描くのがキャンバスの仕様。埋め込む値のエスケープはコンパイラ側に閉じている（上のコメント参照）
        dangerouslySetInnerHTML={innerHtml}
      />
    </li>
  );
}

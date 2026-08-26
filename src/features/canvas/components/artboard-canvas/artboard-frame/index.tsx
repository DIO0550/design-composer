import { type KeyboardEvent, type MouseEvent, useMemo } from "react";
import type { CompiledArtboard } from "@/domains/compiled/compiled-artboard";
import {
  CompiledElement,
  ElementNameAttribute,
} from "@/domains/compiled/compiled-element";
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

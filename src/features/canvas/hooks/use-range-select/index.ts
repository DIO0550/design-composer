import { type PointerEvent as ReactPointerEvent, useState } from "react";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import { RangeSelect } from "@/features/canvas/domains/range-select";
import { CanvasPointer } from "@/features/canvas/utils/CanvasPointer";
import { DrawnBounds } from "@/features/canvas/utils/DrawnBounds";
import { Option } from "@/utils/Option";
import { PointerButton } from "@/utils/PointerButton";

/**
 * その範囲に重なって描かれている、選べるものの名前。
 *
 * 候補はドキュメントが答え（artboard 直下の子）、そのうちどれが重なっているかは
 * 実測が答える（描かれた位置はドキュメントからは分からない）。
 *
 * @param designDocument 候補の出どころ
 * @param range 重なりを見る範囲
 * @returns 重なって描かれているものの名前。1 つも無ければ空
 */
function namesWithin(
  designDocument: DesignDocument,
  range: RangeSelect,
): readonly string[] {
  return DrawnBounds.collectOverlappingNames(
    DesignDocument.collectArtboardChildNames(designDocument),
    RangeSelect.bounds(range),
  );
}

/** 引いている範囲と、それを引くためのポインタの受け口。 */
export type RangeSelectControl = Readonly<{
  /** 今引いている範囲の矩形（client 座標）。引いていなければ `none`。 */
  bounds: Option<CanvasBounds>;
  dragHandlers: Readonly<{
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  }>;
}>;

/**
 * 空き領域から範囲を引いて、重なったものをまとめて選ぶ（docs/06-ui.md「範囲選択」）。
 *
 * 拾う候補はドキュメントが答え（artboard 直下の子）、どれが範囲に重なっているかは実測が答える（描かれた位置はドキュメントからは分からない）。ここが持つのは引いて
 * いる最中の 2 点だけで、矩形にするのも閾値の判定も `RangeSelect` にある（rules/hooks.md「hooks はドメインロジックを持たない」）。
 *
 * **引いていないときの `pointerup` では何もしない。** 土台の `pointerup` には別の場所（パレットの行など）で始まったドラッグの解放も届くため、始めていない操作の終わりで
 * 選択を空にすると、そのたびに選択が消える。
 *
 * @param params 候補の出どころのドキュメントと、選ぶ相手が決まったときに呼ぶ手続き
 * @returns 引いている範囲と、土台へ渡すポインタのハンドラ
 */
export function useRangeSelect(
  params: Readonly<{
    designDocument: DesignDocument;
    onSelect: (names: readonly string[]) => void;
  }>,
): RangeSelectControl {
  const { designDocument, onSelect } = params;
  const [drawing, setDrawing] = useState<Option<RangeSelect>>(Option.none);

  return {
    /*
     * 枠を出すのは引かれてからにする。押した瞬間から出すと、選択のつもりの
     * クリックのたびに 0 面積の枠が一瞬映る（選ぶ相手を決める閾値とも揃う）。
     */
    bounds: Option.flatMap(drawing, (range) =>
      range.isDrawn ? Option.some(RangeSelect.bounds(range)) : Option.none,
    ),
    dragHandlers: {
      onPointerDown: (event) => {
        // 右ボタンのドラッグでは引き始めない（パンは capture 側が先に取る）
        if (!PointerButton.isPrimary(event)) {
          return;
        }
        // ポインタが土台の外へ出ても引き続けられるようにする（キャンバスは画面の端に接する）
        event.currentTarget.setPointerCapture(event.pointerId);
        setDrawing(
          Option.some(RangeSelect.create(CanvasPointer.offsetOf(event))),
        );
      },
      onPointerMove: (event) => {
        if (!drawing.some) {
          return;
        }
        const extended = RangeSelect.extendedTo(
          drawing.value,
          CanvasPointer.offsetOf(event),
        );
        setDrawing(Option.some(extended));
        /*
         * 離すまで待たず、引いている間ずっと選び直す。選択そのものを動かすので、
         * キャンバスの枠・ツリー・インスペクタが同じ 1 つの選択を映したまま追随する。
         * **選択が変わってもコンパイルはやり直さない**ことが前提で（`ArtboardCanvas`
         * の `useMemo`）、崩れると 1 回のドラッグで何度も木を作り直すことになる。
         */
        if (extended.isDrawn) {
          onSelect(namesWithin(designDocument, extended));
        }
      },
      onPointerUp: (event) => {
        if (!drawing.some) {
          return;
        }
        event.currentTarget.releasePointerCapture(event.pointerId);
        const released = RangeSelect.extendedTo(
          drawing.value,
          CanvasPointer.offsetOf(event),
        );
        setDrawing(Option.none);
        /*
         * 離した位置で選び直す。動かしている間も選んでいるが、最後の `pointermove` と
         * 離した位置が同じとは限らない。一度も引かれていない（手ぶれ）なら選択に
         * 手を付けない（`RangeSelect` の `isDrawn` の doc）。
         */
        if (!released.isDrawn) {
          return;
        }
        onSelect(namesWithin(designDocument, released));
      },
    },
  };
}

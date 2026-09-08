import { type PointerEvent as ReactPointerEvent, useState } from "react";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import { RangeSelect } from "@/features/canvas/domains/range-select";
import { CanvasPointer } from "@/features/canvas/utils/CanvasPointer";
import { DrawnBounds } from "@/features/canvas/utils/DrawnBounds";
import { Option } from "@/utils/Option";
import { PointerButton } from "@/utils/PointerButton";

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
 * 拾う候補はドキュメントが答え（artboard 直下の子）、そのうちどれが範囲に重なって
 * いるかは実測が答える（描かれた位置はドキュメントからは分からない）。ここが持つのは
 * 引いている最中の 2 点だけで、矩形にするのも閾値の判定も `RangeSelect` にある
 * （rules/hooks.md「hooks はドメインロジックを持たない」）。
 *
 * **引いていないときの `pointerup` では何もしない。** 土台の `pointerup` には、
 * 別の場所（パレットの行など）で始まったドラッグの解放も届くため、始めていない
 * 操作の終わりで選択を空にすると、そのたびに選択が消える。
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
     * 枠を出すのは引かれてからにする（判定は `RangeSelect.isDrawn`）。押した瞬間から
     * 出すと、選択のつもりのクリックのたびに 0 面積の枠が一瞬映る。
     */
    bounds: Option.flatMap(drawing, (range) =>
      RangeSelect.isDrawn(range)
        ? Option.some(RangeSelect.bounds(range))
        : Option.none,
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
        const pointer = CanvasPointer.offsetOf(event);
        setDrawing((current) =>
          Option.map(current, (range) =>
            RangeSelect.extendedTo(range, pointer),
          ),
        );
      },
      onPointerUp: (event) => {
        if (!drawing.some) {
          return;
        }
        event.currentTarget.releasePointerCapture(event.pointerId);
        setDrawing(Option.none);
        // 手ぶれでは選択に手を付けない（理由は `RangeSelect.isDrawn`）
        if (!RangeSelect.isDrawn(drawing.value)) {
          return;
        }
        onSelect(
          DrawnBounds.collectOverlappingNames(
            DesignDocument.collectArtboardChildNames(designDocument),
            RangeSelect.bounds(drawing.value),
          ),
        );
      },
    },
  };
}

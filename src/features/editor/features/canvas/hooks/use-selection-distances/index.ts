import { useMemo } from "react";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  DistancePair,
  DrawnDistancePair,
} from "@/features/editor/features/canvas/domains/distance-pair";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import type { Pointing } from "@/features/editor/features/canvas/domains/pointing";
import { useMeasured } from "@/features/editor/features/canvas/hooks/use-measured";
import { DrawnBounds } from "@/features/editor/features/canvas/utils/DrawnBounds";
import { Option } from "@/utils/Option";

/** 測った組と、それを描かれている矩形に置き換えたもの。 */
type MeasuredPair = Readonly<{ pair: DistancePair; drawn: DrawnDistancePair }>;

/**
 * 2 つの測った結果が、同じ組の同じ矩形か。
 *
 * @param measured 比べる結果
 * @param other 比べる結果
 * @returns 組の名前と矩形がどちらも等しければ `true`
 */
function isSameMeasured(measured: MeasuredPair, other: MeasuredPair): boolean {
  return (
    DistancePair.equals(measured.pair, other.pair) &&
    DrawnDistancePair.equals(measured.drawn, other.drawn)
  );
}

/**
 * 選択しているだけのときの Alt / Option の距離（docs/06-ui.md「キャンバス直接操作」）。
 *
 * 測り直し方は `useMeasured`。線を返すのは、測った組が今の組と同じときだけ。組が無くなっ
 * た回・別の組に変わった回は、測り直す前の矩形を返さない。
 *
 * @param selection 選択とドキュメントの出どころ
 * @param pointing Alt / Option を押している間のポインタの指し先。出さない間は `none`
 * @returns 選択と相手の間に引く短い線（画面上の px）。測る組が無い / 測れないときは
 *   `FacingDistances.None`
 */
export function useSelectionDistances(
  selection: DocumentSelection,
  pointing: Option<Pointing>,
): FacingDistances {
  const pair = Option.flatMap(pointing, (current) =>
    DistancePair.create(selection, current),
  );
  const measured = useMeasured(
    () =>
      Option.flatMap(pair, (current) =>
        Option.map(
          DistancePair.measure(current, DrawnBounds.measureWithArea),
          (drawn) => ({ pair: current, drawn }),
        ),
      ),
    isSameMeasured,
  );

  const distances = useMemo(
    () =>
      Option.isSome(measured)
        ? DrawnDistancePair.toDistances(measured.value.drawn)
        : FacingDistances.None,
    [measured],
  );
  const isMeasuredForPair = Option.equals(
    pair,
    Option.map(measured, (current) => current.pair),
    DistancePair.equals,
  );
  return isMeasuredForPair ? distances : FacingDistances.None;
}

import { useLayoutEffect, useMemo, useState } from "react";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  DistancePair,
  DrawnDistancePair,
} from "@/features/editor/features/canvas/domains/distance-pair";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import type { Pointing } from "@/features/editor/features/canvas/domains/pointing";
import { DrawnBounds } from "@/features/editor/features/canvas/utils/DrawnBounds";
import { Option } from "@/utils/Option";

/**
 * 2 つの測った結果が同じ矩形を指しているか。
 *
 * @param previous 前に持っていた結果
 * @param next 測り直した結果
 * @returns どちらも不在か、同じ組の同じ矩形を指していれば `true`
 */
function isSame(
  previous: Option<DrawnDistancePair>,
  next: Option<DrawnDistancePair>,
): boolean {
  if (!Option.isSome(previous) || !Option.isSome(next)) {
    return Option.isSome(previous) === Option.isSome(next);
  }
  return DrawnDistancePair.equals(previous.value, next.value);
}

/**
 * 選択しているだけのときの Alt / Option の距離（docs/06-ui.md「キャンバス直接操作」）。
 *
 * 測り方は `useDrawnBounds` と同じく依存配列を持たず毎コミット測り直し、ウィンドウの大き
 * さの変化を購読する（理由はそちらの doc）。測り直した矩形が前と同じなら同じ参照を返す。
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
  const [drawn, setDrawn] = useState<Option<DrawnDistancePair>>(Option.none);

  useLayoutEffect(() => {
    const remeasure = () => {
      setDrawn((previous) => {
        const next = Option.flatMap(pair, (current) =>
          DistancePair.measure(current, DrawnBounds.measureWithArea),
        );
        return isSame(previous, next) ? previous : next;
      });
    };

    remeasure();
    globalThis.window.addEventListener("resize", remeasure);
    return () => globalThis.window.removeEventListener("resize", remeasure);
  });

  const distances = useMemo(
    () =>
      Option.isSome(drawn)
        ? DrawnDistancePair.toDistances(drawn.value)
        : FacingDistances.None,
    [drawn],
  );
  /*
   * 組が無くなった回は、測り直す前の矩形を返さない。layout effect が描く前に消すので画面に
   * は出ないが、返す値がその場の組で決まる形にしておけば、測り直しの順番に頼らずに済む。
   */
  return Option.isSome(pair) ? distances : FacingDistances.None;
}

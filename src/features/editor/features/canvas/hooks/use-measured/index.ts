import { useState } from "react";
import { useRemeasure } from "@/hooks/use-remeasure";
import { Option } from "@/utils/Option";

/**
 * 描かれているものを測った結果を、変わるたびに追いかけて返す。
 *
 * 測り直した値が前と同じなら**同じ参照を返して再レンダーを止める**。測り直す時機とその
 * 理由、拾えない位置の変化は `useRemeasure` に従う。
 *
 * @param measure 今の描かれ方を測る手続き。測れなければ `none`
 * @param equals 前の結果と測り直した結果が同じかを比べる関数
 * @returns 最後に測った結果。測れなければ `none`
 */
export function useMeasured<T>(
  measure: () => Option<T>,
  equals: (value: T, other: T) => boolean,
): Option<T> {
  const [measured, setMeasured] = useState<Option<T>>(Option.none);

  useRemeasure(() => {
    setMeasured((previous) => {
      const next = measure();
      return Option.equals(previous, next, equals) ? previous : next;
    });
  });

  return measured;
}

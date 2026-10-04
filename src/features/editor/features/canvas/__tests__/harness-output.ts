import { screen } from "@testing-library/react";

/**
 * フックを DOM へ繋いだだけの器が、`data-testid` を付けた要素に出している文言。
 *
 * 器ごとに `clicked()` / `grabbed()` のような読み手を書くと、testid が同じなら本体まで同じ
 * になり、器のある数だけ同じ関数が並ぶ。読む先は testid だけで決まるので 1 本で受ける。
 * 使っているのがキャンバスのフックの器だけなので、この feature に置く。
 *
 * @param testId 文言を出している要素の `data-testid`
 * @returns その要素の文言。要素が無ければテストを落とす
 */
export function harnessOutput(testId: string): string {
  return screen.getByTestId(testId).textContent ?? "";
}

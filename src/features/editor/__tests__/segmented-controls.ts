import { screen, within } from "@testing-library/react";

/**
 * 画面に出ているセグメントコントロール（`src/components/segmented-control`）を読む。
 *
 * 同じ選択肢を持つコントロールが 1 画面に並ぶ（Box の `align` と `justify` は
 * どちらも `start` / `center` / `end` を持つ）ため、必ず器で絞ってから引く。
 * プロパティパネル単体と編集画面の通しの両方が同じ引き方を要るので、
 * feature 直下に置いて共有する。
 */

/**
 * 名前で引いた 1 つのセグメント。
 *
 * @param group コントロールの読み上げ名
 * @param option セグメントの綴り
 * @returns そのセグメントのボタン。無ければテストを落とす
 */
export function segmentOf(group: string, option: string): HTMLElement {
  return within(screen.getByRole("group", { name: group })).getByRole(
    "button",
    { name: option },
  );
}

/**
 * 選ばれているセグメントの綴り。
 *
 * @param group コントロールの読み上げ名
 * @returns 選ばれているセグメントの綴りの並び。未指定なら空
 */
export function pressedSegmentsOf(group: string): readonly string[] {
  return within(screen.getByRole("group", { name: group }))
    .queryAllByRole("button", { pressed: true })
    .map((segment) => segment.textContent ?? "");
}

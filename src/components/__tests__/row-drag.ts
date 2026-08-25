import { within } from "@testing-library/react";
import { dragRow } from "@/components/__tests__/pointer-gesture";

/**
 * 並べ替えの行を掴む操作。ツリー（`components/nested-row-list`）・artboard の一覧
 * （`features/sidebar`）・編集画面の通し（`features/editor`）のどれもが同じ引き方を
 * するため、横断層に置いて共有する。
 *
 * 持っているのは「行は名前を読み上げるボタンを含む枠」という汎用 UI の知識だけで、
 * ドメインは知らない（`row-names.ts` と同じ形）。
 */

/**
 * 名前で行の枠を引く。
 *
 * 名前のボタンそのものではなく**その親**を返すのは、掴む口が行だけを包む要素に
 * 張ってあるため。ツリーの `<li>` は配下の並びまで包んでいるので、そちらに張ると
 * 子の行を押したときに親を掴んでしまう（pointerdown はバブルする）。
 * artboard の一覧は `<li>` が行そのものなので、どちらでも同じ要素に行き着く。
 *
 * @param list 行が並んでいる領域
 * @param name 引きたい行の名前
 * @returns その行の枠。見つからなければテストを落とす
 */
export function rowOf(list: HTMLElement, name: string): HTMLElement {
  const row = within(list).getByRole("button", { name }).parentElement;
  if (row === null) {
    throw new Error(`行が見つからない: ${name}`);
  }
  return row;
}

/**
 * 行を掴んで別の行の上まで運ぶ（並べ替えの 1 操作）。
 *
 * @param list 行が並んでいる領域
 * @param movement 掴む行と運ぶ先の行の名前
 */
export function dragRowNamed(
  list: HTMLElement,
  movement: Readonly<{ from: string; to: string }>,
): void {
  dragRow({ from: rowOf(list, movement.from), to: rowOf(list, movement.to) });
}

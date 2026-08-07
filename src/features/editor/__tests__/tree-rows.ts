import { within } from "@testing-library/react";

/**
 * ツリービューに並んでいる行を読む。
 * ツリー単体（components/document-tree）とエディタ画面（components/editor-screen）の
 * 両方が「並びがどう見えているか」を確かめるため、feature 直下に置いて共有する。
 *
 * 行は名前のほかに型アイコンと補助情報も出すため、名前は表示文字列ではなく
 * 読み上げ名（`aria-label`）から読む。
 */

/**
 * 行かどうかは `aria-current` を持つかで見る。ツリーの中には行以外のボタン
 * （並べ替え・開閉）も並ぶが、選択の対象になるのは行だけなので、ボタンが増えても
 * この判定は変わらない（React は `aria-*` の真偽値を `"false"` としても書き出すため、
 * 選択されていない行にも属性が出る）。
 *
 * 危ないのは逆で、**行ではないのに選択の対象になるボタン**をツリーの中へ足すと、
 * ここが黙ってそれを行として拾う（テストは落ちず、期待値を書き換えて通してしまう）。
 * そうなったら、行そのものに役割を宣言して引く形へ変えること。
 */
function rows(tree: HTMLElement): readonly HTMLElement[] {
  return within(tree)
    .getAllByRole("button")
    .filter((button) => button.hasAttribute("aria-current"));
}

function nameOf(row: HTMLElement): string {
  return row.getAttribute("aria-label") ?? "";
}

/** 画面に出ている順の行の名前。 */
export function treeRowNames(tree: HTMLElement): readonly string[] {
  return rows(tree).map(nameOf);
}

/** 選択状態になっている行の名前。 */
export function selectedTreeRowNames(tree: HTMLElement): readonly string[] {
  return rows(tree)
    .filter((row) => row.getAttribute("aria-current") === "true")
    .map(nameOf);
}
